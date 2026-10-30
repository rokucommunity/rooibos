import type { AnnotationExpression, ArrayLiteralExpression, BrsFile, BscType, BsDiagnostic, ClassStatement, Editor, Expression, FunctionStatement, MethodStatement, Statement } from 'brighterscript';
import { createIdentifier, DottedGetExpression, TypeExpression, VariableExpression, ParseMode, Parser, SymbolTypeFlag, WalkMode, createStringLiteral, isAAMemberExpression, isAALiteralExpression, isArrayLiteralExpression, isCallExpression, isCallfuncExpression, isDottedGetExpression, isFunctionStatement, isIndexedGetExpression, isLiteralExpression, isVariableExpression, isVoidType, isXmlScope, isDynamicType, isEnumType, isNamespaceType, walkArray } from 'brighterscript';
import { DiagnosticMessages } from 'brighterscript/dist/DiagnosticMessages';
import type { CachedLookups } from 'brighterscript/dist/astUtils/CachedLookups';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';
import type { TestSuite } from './TestSuite';

/**
 * Add a generated method to the class.
 * @returns the added method, or undefined if the source could not be parsed
 */
export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string, editor: Editor): MethodStatement | undefined {
    let { method, diagnostics, text } = createMethod(file, name, source);

    if (method.func.body.statements.length > 0) {
        //bsc has a quirk where it auto-adds a `new` method if missing. That messes with our AST editing, so
        //trigger that functionality BEFORE performing AstEditor operations. TODO remove this whenever bsc stops doing this.
        (target as any).ensureConstructorFunctionExists?.();
        editor.addToArray(target.body, target.body.length, method);
        method.parent = target;
        return method;
    }
    const error = diagnostics?.length > 0 ? diagnostics[0].message : 'unknown error';
    diagnosticCorruptTestProduced(file, annotation, error, text);
    return undefined;
}

/**
 * Create a new MethodStatement instance with the given name and body.
 *
 * This is a HACK to be able to build the same MethodStatement instance as the version of brighterscript we're running against. (because otherwise, some older versions
 * of bsc (like the one rooibos depends on) have a bug that doesn't transpile the method name correctly in some instances)
 * @param file any file from the host program's version of  (we're going to utilize its `constructor` and `parse` functions to create a new MethodStatement instance)
 * @param name name of the method to create
 * @param body string text containing the body of the method
 */
function createMethod(file: BrsFile, name: string, body: string) {
    const text = `
        class RooibosTemplateClass
            public override function ${name}()
                ${body}
            end function
        end class
    `;
    try {
        //parse a new instance of a file, so we can abuse its `parse` function, which will use the _current_ version of the MethodStatement class
        const f: BrsFile = new (file.constructor as any)({
            srcPath: file.srcPath, destPath: file.destPath, pkgPath: file.pkgPath, program: file.program
        });
        f.parse(text);
        return {
            method: (f.ast.statements[0] as ClassStatement).body[0] as MethodStatement,
            text: text,
            diagnostics: []//f.program.
        };
    } catch (e) {
        console.error(`Error generating method '${name}' while using the host bsc version. Falling back to embedded Parser.parse`, {
            cause: e
        });

        const { ast, diagnostics } = Parser.parse(text, { mode: ParseMode.BrighterScript });
        return {
            method: (ast.statements[0] as ClassStatement).body[0] as MethodStatement,
            text: text,
            diagnostics: diagnostics
        };
    }
}

export function sanitizeBsJsonString(text: string) {
    return `"${text ? text.replace(/"/g, '\'') : ''}"`;
}

export function functionRequiresReturnValue(statement: FunctionStatement) {
    const functionReturnType = statement.func.getType({ flags: SymbolTypeFlag.typetime }).returnType;
    return !isVoidType(functionReturnType);
}

export function getAllDottedGetParts(dg: DottedGetExpression) {

    // TODO - Similar function in utils

    let parts = [dg?.tokens.name?.text];
    let nextPart = dg.obj;
    while (isDottedGetExpression(nextPart) || isVariableExpression(nextPart)) {
        parts.push(nextPart?.tokens.name?.text);
        nextPart = isDottedGetExpression(nextPart) ? nextPart.obj : undefined;
    }
    return parts.reverse();
}

export function getRootObjectFromDottedGet(value: DottedGetExpression) {
    // TODO - Similar function in utils

    let root;
    if (isDottedGetExpression(value) || isIndexedGetExpression(value)) {

        root = value.obj;
        while (root.obj) {
            root = root.obj;
        }
    } else {
        root = value;
    }

    return root;
}

export function getStringPathFromDottedGet(value: DottedGetExpression) {
    // TODO - Similar function in utils

    let parts = [getPathValuePartAsString(value)];
    let root;
    root = value.obj;
    while (root) {
        if (isCallExpression(root) || isCallfuncExpression(root)) {
            return undefined;
        }
        parts.push(`${getPathValuePartAsString(root)}`);
        root = root.obj;
    }
    let joinedParts = parts.reverse().join('.');
    return joinedParts === '' ? undefined : createStringLiteral(joinedParts);
}

export function getPathValuePartAsString(expr: Expression) {
    if (isCallExpression(expr) || isCallfuncExpression(expr)) {
        return undefined;
    }
    if (isVariableExpression(expr)) {
        return expr.tokens.name.text;
    }
    if (!expr) {
        return undefined;
    }
    if (isDottedGetExpression(expr)) {
        return expr.tokens.name.text;
    } else if (isIndexedGetExpression(expr)) {
        const firstIndex = expr.indexes[0];
        if (isLiteralExpression(firstIndex)) {
            return `${firstIndex.tokens.value.text.replace(/^"/, '').replace(/"$/, '')}`;
        } else if (isVariableExpression(firstIndex)) {
            return `${firstIndex.tokens.name.text}`;
        }
    }
}

/**
 * bsc does not link annotations into the AST, so the expressions in their arguments have no parent (and therefore no symbol table or namespace).
 * That makes the bsc validator flag references like `@params(SomeEnum.value)` as unknown names. Link the annotation (and its arguments) to
 * the statement it decorates so those references are validated and resolved like any other expression in that statement's scope.
 */
export function linkAnnotationToStatement(annotation: AnnotationExpression, statement: Statement) {
    if (!annotation?.call) {
        return;
    }
    walkArray(annotation.call.args, () => { }, { walkMode: WalkMode.visitAllRecursive }, annotation.call);
    annotation.call.parent = annotation;
    annotation.parent = statement;
}

/**
 * bsc validates names by walking the AST, which never visits annotations, so unknown names in
 * `@params` arguments would go unreported. Find them the same way: resolve each name chain
 * (`a`, `a.b.c`) left to right and report the first part that does not resolve.
 * The annotation must already be linked into the AST (see `linkAnnotationToStatement`).
 */
export function getUnresolvedNameDiagnostics(annotation: AnnotationExpression): BsDiagnostic[] {
    const diagnostics: BsDiagnostic[] = [];
    const expressions: Expression[] = [];
    for (const argument of annotation?.call?.args ?? []) {
        expressions.push(argument);
        argument.walk((node) => {
            expressions.push(node as Expression);
        }, { walkMode: WalkMode.visitExpressionsRecursive });
    }
    for (const expression of expressions) {
        const isChainHead = (isVariableExpression(expression) || isDottedGetExpression(expression)) &&
            !(isDottedGetExpression(expression.parent) && expression.parent.obj === expression);
        if (isChainHead) {
            const diagnostic = getUnresolvedNameDiagnostic(expression);
            if (diagnostic) {
                diagnostics.push(diagnostic);
            }
        }
    }
    return diagnostics;
}

function getUnresolvedNameDiagnostic(chainHead: DottedGetExpression | VariableExpression): BsDiagnostic | undefined {
    const parts: Array<DottedGetExpression | VariableExpression> = [];
    let part: Expression = chainHead;
    while (isDottedGetExpression(part)) {
        parts.unshift(part);
        part = part.obj;
    }
    if (!isVariableExpression(part)) {
        //chains rooted in a call, literal, etc. have nothing to look up by name
        return undefined;
    }
    parts.unshift(part);

    for (let index = 0; index < parts.length; index++) {
        const type = parts[index].getType({ flags: SymbolTypeFlag.runtime });
        //an unknown enum member resolves to dynamic rather than to an unresolvable type
        const isUnknownEnumMember = index > 0 && isDynamicType(type) && isEnumType(parts[index - 1].getType({ flags: SymbolTypeFlag.runtime }));
        if (type?.isResolvable() && !isUnknownEnumMember) {
            continue;
        }
        const name = parts[index].tokens.name.text;
        let message: { message: string; code: string | number };
        if (index === 0) {
            message = DiagnosticMessages.cannotFindName(name);
        } else {
            const fullName = parts.slice(0, index + 1).map((x) => x.tokens.name.text).join('.');
            const parentType = parts[index - 1].getType({ flags: SymbolTypeFlag.runtime });
            let parentTypeDescriptor: string;
            if (isEnumType(parentType)) {
                parentTypeDescriptor = 'enum';
            } else if (isNamespaceType(parentType)) {
                parentTypeDescriptor = 'namespace';
            }
            message = DiagnosticMessages.cannotFindName(name, fullName, parentType?.toString(), parentTypeDescriptor);
        }
        return {
            ...message,
            location: parts[index].tokens.name.location
        } as BsDiagnostic;
    }
    return undefined;
}

/**
 * Fill the `rawParams: []` placeholders in a generated `getTestSuiteData` method with clones of each test case's actual `@params` argument expressions.
 * The clones are registered in the file's cached expression lookups, so bsc's own pre-transpile processing (i.e. inlining enums and constants) applies to them
 * exactly like it does for handwritten code. This must run before bsc's `prepareFile` (i.e. during `beforeBuildProgram`).
 * @param file the file containing the test suite
 * @param method the generated `getTestSuiteData` method
 * @param paramExpressionsList the `@params` argument expressions for each placeholder, in the order they appear in the method
 * @param editor the editor used to make (and later undo) the changes
 */
export function addParamsToTestSuiteData(file: BrsFile, method: MethodStatement, paramExpressionsList: Expression[][], editor: Editor) {
    const placeholders: ArrayLiteralExpression[] = [];
    method.walk((node) => {
        if (isAAMemberExpression(node) && node.tokens.key.text === 'rawParams' && isArrayLiteralExpression(node.value)) {
            placeholders.push(node.value);
        }
    }, { walkMode: WalkMode.visitExpressionsRecursive });

    const references = new Set<Expression>();
    const addReferences = (expression: Expression) => {
        references.add(expression);
        if (isArrayLiteralExpression(expression)) {
            for (const element of expression.elements) {
                addReferences(element);
            }
        } else if (isAALiteralExpression(expression)) {
            for (const member of expression.elements) {
                if (isAAMemberExpression(member)) {
                    addReferences(member.value);
                }
            }
        }
    };

    for (let i = 0; i < placeholders.length && i < paramExpressionsList.length; i++) {
        const clones = paramExpressionsList[i].map(x => x.clone());
        editor.arrayPush(placeholders[i].elements, ...clones);
        //link the clones into the AST
        walkArray(placeholders[i].elements, () => { }, { walkMode: WalkMode.visitAllRecursive }, placeholders[i]);
        clones.forEach(addReferences);
    }

    const fileReferences = getFileLookups(file).expressions;
    editor.edit(() => {
        for (const expression of references) {
            fileReferences.add(expression);
        }
    }, () => {
        for (const expression of references) {
            fileReferences.delete(expression);
        }
    });
}

export function getScopeForSuite(testSuite: TestSuite) {
    if (testSuite.isNodeTest) {
        return testSuite.file.program.getScopesForFile(testSuite.file).find((scope) => {
            return isXmlScope(scope) && scope.xmlFile.componentName.text === testSuite.generatedNodeName;
        });

    } else {
        return testSuite.file.program.getFirstScopeForFile(testSuite.file);
    }
}

export function getFileLookups(file: BrsFile): CachedLookups {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    return file['_cachedLookups'] as CachedLookups;
}

export function getMainFunctionStatement(file: BrsFile) {
    return file.ast.statements.find((fs) => isFunctionStatement(fs) && fs.tokens.name.text.toLowerCase() === 'main') as FunctionStatement;
}


export function getTypeExpressionFromBscType(type: BscType) {
    // This should probably exist in brighterscript
    const typeName = type.toString();
    const typeParts = typeName.split('.');
    let i = 0;
    let innerExpression: DottedGetExpression | VariableExpression;
    while (i < typeParts.length) {
        if (i === 0) {
            innerExpression = new VariableExpression({ name: createIdentifier(typeParts[i]) });
        } else {
            innerExpression = new DottedGetExpression({ obj: innerExpression, name: createIdentifier(typeParts[i]) });
        }
        i++;
    }
    return new TypeExpression({
        expression: innerExpression
    });
}
