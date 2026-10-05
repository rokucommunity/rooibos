import type { AnnotationExpression, ArrayLiteralExpression, AstEditor, BrsFile, ClassStatement, DottedGetExpression, Expression, FunctionStatement, MethodStatement, Statement } from 'brighterscript';
import { ParseMode, Parser, TokenKind, WalkMode, createStringLiteral, isAAMemberExpression, isAALiteralExpression, isArrayLiteralExpression, isCallExpression, isCallfuncExpression, isCommentStatement, isDottedGetExpression, isIndexedGetExpression, isLiteralExpression, isVariableExpression, isXmlScope, walkArray } from 'brighterscript';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';
import type { TestSuite } from './TestSuite';

/**
 * Add a generated method to the class.
 * @returns the added method, or undefined if the source could not be parsed
 */
export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string, editor: AstEditor): MethodStatement | undefined {
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
 * @param file any file from the host program's version of BrighterScript. (we're going to utilize its `constructor` and `parse` functions to create a new MethodStatement instance)
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
        const f: BrsFile = new (file.constructor as any)(file.srcPath, file.pkgPath, file.program);
        f.parse(text);
        return {
            method: (f.ast.statements[0] as ClassStatement).body[0] as MethodStatement,
            text: text,
            diagnostics: f.diagnostics
        };
    } catch (e) {
        console.error(`Error generating method '${name}' while using the host bsc version. Falling back to embedded Parser.parse`, {
            cause: e
        });

        const { statements, diagnostics } = Parser.parse(text, { mode: ParseMode.BrighterScript });
        return {
            method: (statements[0] as ClassStatement).body[0] as MethodStatement,
            text: text,
            diagnostics: diagnostics
        };
    }
}

export function sanitizeBsJsonString(text: string) {
    return `"${text ? text.replace(/"/g, '\'') : ''}"`;
}

export function functionRequiresReturnValue(statement: FunctionStatement) {
    const returnTypeToken = statement.func.returnTypeToken;
    const functionType = statement.func.functionType;
    return !((functionType?.kind === TokenKind.Sub && (returnTypeToken === undefined || returnTypeToken?.kind === TokenKind.Void)) || returnTypeToken?.kind === TokenKind.Void);
}

export function getAllDottedGetParts(dg: DottedGetExpression) {
    let parts = [dg?.name?.text];
    let nextPart = dg.obj;
    while (isDottedGetExpression(nextPart) || isVariableExpression(nextPart)) {
        parts.push(nextPart?.name?.text);
        nextPart = isDottedGetExpression(nextPart) ? nextPart.obj : undefined;
    }
    return parts.reverse();
}

export function getRootObjectFromDottedGet(value: DottedGetExpression) {
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
        return expr.name.text;
    }
    if (!expr) {
        return undefined;
    }
    if (isDottedGetExpression(expr)) {
        return expr.name.text;
    } else if (isIndexedGetExpression(expr)) {
        if (isLiteralExpression(expr.index)) {
            return `${expr.index.token.text.replace(/^"/, '').replace(/"$/, '')}`;
        } else if (isVariableExpression(expr.index)) {
            return `${expr.index.name.text}`;
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
 * Fill the `rawParams: []` placeholders in a generated `getTestSuiteData` method with clones of each test case's actual `@params` argument expressions.
 * The clones are registered in the file's references, so bsc's own pre-transpile processing (i.e. inlining enums and constants) applies to them
 * exactly like it does for handwritten code. This must run before bsc's `beforeFileTranspile` (i.e. during `beforeProgramTranspile`).
 * @param file the file containing the test suite
 * @param method the generated `getTestSuiteData` method
 * @param paramExpressionsList the `@params` argument expressions for each placeholder, in the order they appear in the method
 * @param editor the editor used to make (and later undo) the changes
 */
export function addParamsToTestSuiteData(file: BrsFile, method: MethodStatement, paramExpressionsList: Expression[][], editor: AstEditor) {
    const placeholders: ArrayLiteralExpression[] = [];
    method.walk((node) => {
        if (isAAMemberExpression(node) && node.keyToken.text === 'rawParams' && isArrayLiteralExpression(node.value)) {
            placeholders.push(node.value);
        }
    }, { walkMode: WalkMode.visitExpressionsRecursive });

    const references = new Set<Expression>();
    const addReferences = (expression: Expression) => {
        references.add(expression);
        if (isArrayLiteralExpression(expression)) {
            for (const element of expression.elements) {
                if (!isCommentStatement(element)) {
                    addReferences(element);
                }
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

    const fileReferences = file.parser.references.expressions;
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
