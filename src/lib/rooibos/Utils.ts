import type { AnnotationExpression, AstEditor, BrsFile, ClassStatement, DottedGetExpression, Expression, FunctionStatement, LiteralExpression, MethodStatement, NamespaceStatement, Scope, Statement } from 'brighterscript';
import { ParseMode, Parser, TokenKind, WalkMode, createStringLiteral, isAAMemberExpression, isAALiteralExpression, isArrayLiteralExpression, isCallExpression, isCallfuncExpression, isCommentStatement, isDottedGetExpression, isIndexedGetExpression, isIntegerType, isLiteralBoolean, isLiteralExpression, isLiteralInvalid, isLiteralNumber, isLiteralString, isLongIntegerType, isNamespaceStatement, isTemplateStringExpression, isUnaryExpression, isVariableExpression, isXmlScope, util, walkArray } from 'brighterscript';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';
import type { TestSuite } from './TestSuite';

export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string, editor: AstEditor): boolean {
    let { method, diagnostics, text } = createMethod(file, name, source);

    if (method.func.body.statements.length > 0) {
        //bsc has a quirk where it auto-adds a `new` method if missing. That messes with our AST editing, so
        //trigger that functionality BEFORE performing AstEditor operations. TODO remove this whenever bsc stops doing this.
        (target as any).ensureConstructorFunctionExists?.();
        editor.addToArray(target.body, target.body.length, method);
        return true;
    }
    const error = diagnostics?.length > 0 ? diagnostics[0].message : 'unknown error';
    diagnosticCorruptTestProduced(file, annotation, error, text);
    return false;
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
 * Convert an annotation argument into a plain value. Literals, arrays and associative arrays are supported (matching bsc's `AnnotationExpression.getArguments()`).
 * When a scope is provided, enum members and constants (including ones nested in arrays/AAs or referencing each other) are resolved to their values.
 * Anything that can't be resolved becomes `null` (i.e. `invalid`)
 */
export function annotationArgumentToValue(expr: Expression, scope?: Scope, visited = new Set<Statement>()): any {
    if (!expr) {
        return null;
    }
    if (isUnaryExpression(expr) && isLiteralNumber(expr.right)) {
        return numberLiteralToValue(expr.right, expr.operator.text);
    }
    if (isLiteralString(expr)) {
        return expr.token.text.replace(/^"/, '').replace(/"$/, '');
    }
    if (isLiteralNumber(expr)) {
        return numberLiteralToValue(expr);
    }
    if (isLiteralBoolean(expr)) {
        return expr.token.text.toLowerCase() === 'true';
    }
    if (isLiteralInvalid(expr)) {
        return null;
    }
    if (isArrayLiteralExpression(expr)) {
        return expr.elements
            .filter(e => !isCommentStatement(e))
            .map(e => annotationArgumentToValue(e, scope, visited));
    }
    if (isAALiteralExpression(expr)) {
        return expr.elements.reduce((acc, e) => {
            if (isAAMemberExpression(e)) {
                acc[e.keyToken.text] = annotationArgumentToValue(e.value, scope, visited);
            }
            return acc;
        }, {});
    }
    if (isTemplateStringExpression(expr) && expr.quasis?.length === 1 && expr.expressions.length === 0) {
        return expr.quasis[0].expressions.map(x => x.token.text).join('');
    }
    if (scope && (isVariableExpression(expr) || isDottedGetExpression(expr))) {
        return resolveEnumOrConstValue(expr, scope, visited);
    }
    return null;
}

function numberLiteralToValue(expr: LiteralExpression, operator = '') {
    const text = expr.token.text;
    if (/^&h/i.test(text)) {
        return parseInt(operator + text.replace(/^&h/i, ''), 16);
    }
    if (isIntegerType(expr.type) || isLongIntegerType(expr.type)) {
        return parseInt(operator + text);
    }
    return parseFloat(operator + text);
}

function resolveEnumOrConstValue(expr: Expression, scope: Scope, visited: Set<Statement>) {
    const name = util.getAllDottedGetParts(expr)?.map(x => x.text).join('.');
    if (!name) {
        return null;
    }
    const containingNamespace = expr.findAncestor<NamespaceStatement>(isNamespaceStatement)?.getName(ParseMode.BrighterScript);

    const constStatement = scope.getConstFileLink(name, containingNamespace)?.item;
    if (constStatement) {
        if (visited.has(constStatement)) {
            return null;
        }
        return annotationArgumentToValue(constStatement.value, scope, new Set([...visited, constStatement]));
    }

    const enumMember = scope.getEnumMemberFileLink(name, containingNamespace)?.item;
    if (enumMember) {
        if (visited.has(enumMember)) {
            return null;
        }
        if (enumMember.value) {
            return annotationArgumentToValue(enumMember.value, scope, new Set([...visited, enumMember]));
        }
        //members without a value are auto-incremented integers
        return parseInt(enumMember.getValue());
    }
    return null;
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
