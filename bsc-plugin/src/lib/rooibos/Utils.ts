import type { AnnotationExpression, Editor, BrsFile, ClassStatement, Expression, FunctionStatement } from 'brighterscript';
import type { CachedLookups } from 'brighterscript/dist/astUtils/CachedLookups';
import { TokenKind, isXmlScope } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';
import type { TestSuite } from './TestSuite';

export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string, editor: Editor): boolean {
    let functionSource = `
        function ${name}()
            ${source}
        end function
    `;

    let { ast, diagnostics } = brighterscript.Parser.parse(functionSource, { mode: brighterscript.ParseMode.BrighterScript });
    let statements = ast.statements;
    let error = '';
    if (statements && statements.length > 0) {
        let statement = statements[0] as FunctionStatement;
        if (statement.func.body.statements.length > 0) {
            let p = brighterscript.createToken(brighterscript.TokenKind.Public, 'public', target.location);
            let o = brighterscript.createToken(brighterscript.TokenKind.Override, 'override', target.location);
            let n = brighterscript.createIdentifier(name, target.location);
            let method = new brighterscript.MethodStatement({
                modifiers: [p],
                name: n,
                func: statement.func,
                override: o
            });
            //bsc has a quirk where it auto-adds a `new` method if missing. That messes with our AST editing, so
            //trigger that functionality BEFORE performing AstEditor operations. TODO remove this whenever bsc stops doing this.
            // eslint-disable-next-line @typescript-eslint/dot-notation
            target['ensureConstructorFunctionExists']?.();
            editor.addToArray(target.body, target.body.length, method);
            return true;
        }

    }
    error = diagnostics?.length > 0 ? diagnostics[0].message : 'unknown error';
    diagnosticCorruptTestProduced(file, annotation, error, functionSource);
    return false;
}

export function sanitizeBsJsonString(text: string) {
    return `"${text ? text.replace(/"/g, '\'') : ''}"`;
}

export function functionRequiresReturnValue(statement: FunctionStatement) {
    const functionReturnType = statement.func.getType({ flags: brighterscript.SymbolTypeFlag.typetime }).returnType;
    return !brighterscript.isVoidType(functionReturnType);
}

export function getAllDottedGetParts(dg: brighterscript.DottedGetExpression) {

    // TODO - Similar function in brighterscript.utils

    let parts = [dg?.tokens.name?.text];
    let nextPart = dg.obj;
    while (brighterscript.isDottedGetExpression(nextPart) || brighterscript.isVariableExpression(nextPart)) {
        parts.push(nextPart?.tokens.name?.text);
        nextPart = brighterscript.isDottedGetExpression(nextPart) ? nextPart.obj : undefined;
    }
    return parts.reverse();
}

export function getRootObjectFromDottedGet(value: brighterscript.DottedGetExpression) {
    // TODO - Similar function in brighterscript.utils

    let root;
    if (brighterscript.isDottedGetExpression(value) || brighterscript.isIndexedGetExpression(value)) {

        root = value.obj;
        while (root.obj) {
            root = root.obj;
        }
    } else {
        root = value;
    }

    return root;
}

export function getStringPathFromDottedGet(value: brighterscript.DottedGetExpression) {
    // TODO - Similar function in brighterscript.utils

    let parts = [getPathValuePartAsString(value)];
    let root;
    root = value.obj;
    while (root) {
        if (brighterscript.isCallExpression(root) || brighterscript.isCallfuncExpression(root)) {
            return undefined;
        }
        parts.push(`${getPathValuePartAsString(root)}`);
        root = root.obj;
    }
    let joinedParts = parts.reverse().join('.');
    return joinedParts === '' ? undefined : brighterscript.createStringLiteral(joinedParts);
}

export function getPathValuePartAsString(expr: Expression) {
    if (brighterscript.isCallExpression(expr) || brighterscript.isCallfuncExpression(expr)) {
        return undefined;
    }
    if (brighterscript.isVariableExpression(expr)) {
        return expr.tokens.name.text;
    }
    if (!expr) {
        return undefined;
    }
    if (brighterscript.isDottedGetExpression(expr)) {
        return expr.tokens.name.text;
    } else if (brighterscript.isIndexedGetExpression(expr)) {
        const firstIndex = expr.indexes[0];
        if (brighterscript.isLiteralExpression(firstIndex)) {
            return `${firstIndex.tokens.value.text.replace(/^"/, '').replace(/"$/, '')}`;
        } else if (brighterscript.isVariableExpression(firstIndex)) {
            return `${firstIndex.tokens.name.text}`;
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

export function getFileLookups(file: BrsFile): CachedLookups {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    return file['_cachedLookups'] as CachedLookups;
}

export function getMainFunctionStatement(file: BrsFile) {
    return getFileLookups(file).functionStatements.find((fs) => fs.tokens.name.text === 'main');
}
