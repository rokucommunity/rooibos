import { AnnotationExpression, BrsFile, BscType, ClassStatement, createIdentifier, DottedGetExpression, Editor, Expression, FunctionStatement, MethodStatement, TypeExpression, VariableExpression, ParseMode, Parser, SymbolTypeFlag, createStringLiteral, isCallExpression, isCallfuncExpression, isDottedGetExpression, isFunctionStatement, isIndexedGetExpression, isLiteralExpression, isVariableExpression, isVoidType, isXmlScope } from 'brighterscript';
import type { CachedLookups } from 'brighterscript/dist/astUtils/CachedLookups';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';
import type { TestSuite } from './TestSuite';

export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string, editor: Editor): boolean {
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
