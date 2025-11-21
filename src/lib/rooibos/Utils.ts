import type { AnnotationExpression, AstEditor, BrsFile, ClassStatement, DottedGetExpression, Expression, FunctionStatement, MethodStatement } from 'brighterscript';
import { ParseMode, Parser, TokenKind, createStringLiteral, isCallExpression, isCallfuncExpression, isDottedGetExpression, isIndexedGetExpression, isLiteralExpression, isVariableExpression, isXmlScope } from 'brighterscript';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';
import type { TestSuite } from './TestSuite';

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

export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string, editor: AstEditor): boolean {
    let { method, diagnostics, text } = createMethod(file, name, source);

    let error = '';
    if (method.func.body.statements.length > 0) {
        //bsc has a quirk where it auto-adds a `new` method if missing. That messes with our AST editing, so
        //trigger that functionality BEFORE performing AstEditor operations. TODO remove this whenever bsc stops doing this.
        (target as any).ensureConstructorFunctionExists?.();
        editor.addToArray(target.body, target.body.length, method);
        return true;
    }
    error = diagnostics?.length > 0 ? diagnostics[0].message : 'unknown error';
    diagnosticCorruptTestProduced(file, annotation, error, text);
    return false;
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

export function getScopeForSuite(testSuite: TestSuite) {
    if (testSuite.isNodeTest) {
        return testSuite.file.program.getScopesForFile(testSuite.file).find((scope) => {
            return isXmlScope(scope) && scope.xmlFile.componentName.text === testSuite.generatedNodeName;
        });

    } else {
        return testSuite.file.program.getFirstScopeForFile(testSuite.file);
    }
}
