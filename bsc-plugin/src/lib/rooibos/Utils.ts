import type { BrsFile, ClassStatement, Expression, FunctionStatement, Statement, AnnotationExpression } from 'brighterscript';
import { createVariableExpression } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';

export function spliceString(str: string, index: number, count: number, add: string): string {
    // We cannot pass negative indexes directly to the 2nd slicing operation.
    if (index < 0) {
        index = str.length + index;
        if (index < 0) {
            index = 0;
        }
    }

    return str.slice(0, index) + (add || '') + str.slice(index + count);
}

export function getRegexMatchesValues(input, regex, groupIndex): any[] {
    let values = [];
    let matches: any[];
    // eslint-disable-next-line
    while (matches = regex.exec(input)) {
        values.push(matches[groupIndex]);
    }
    return values;
}
export function getRegexMatchValue(input, regex, groupIndex): string {
    let matches: any[];
    // eslint-disable-next-line
    while (matches = regex.exec(input)) {
        if (matches.length > groupIndex) {
            return matches[groupIndex];
        }
    }
    return null;
}

export function addSetItems(setA, setB) {
    for (const elem of setB) {
        setA.add(elem);
    }
}

export function pad(pad: string, str: string, padLeft: number): string {
    if (typeof str === 'undefined') {
        return pad;
    }
    if (padLeft) {
        return (pad + str).slice(-pad.length);
    } else {
        return (str + pad).substring(0, pad.length);
    }
}

export function makeASTFunction(source: string): FunctionStatement | undefined {
    let tokens = brighterscript.Lexer.scan(source).tokens;
    let { statements } = brighterscript.Parser.parse(tokens, { mode: brighterscript.ParseMode.BrighterScript });
    if (statements && statements.length > 0) {
        return statements[0] as FunctionStatement;
    }
    return undefined;
}

export function getFunctionBody(source: string): Statement[] {
    let funcStatement = makeASTFunction(source);
    return funcStatement ? funcStatement.func.body.statements : [];
}

export function changeFunctionBody(statement: brighterscript.ClassMethodStatement | FunctionStatement, source: Statement[] | string) {
    let statements = statement.func.body.statements;
    statements.splice(0, statements.length);
    let newStatements = (typeof source === 'string') ? getFunctionBody(source) : source;
    for (let newStatement of newStatements) {
        statements.push(newStatement);
    }
}

export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string): boolean {
    let funcSource = `
  function ${name}()
    ${source}
  end function
  `;

    let tokens = brighterscript.Lexer.scan(funcSource).tokens;
    let { statements, diagnostics } = brighterscript.Parser.parse(tokens, { mode: brighterscript.ParseMode.BrighterScript });
    let error = '';
    if (statements && statements.length > 0) {
        let statement = statements[0] as FunctionStatement;
        if (statement.func.body.statements.length > 0) {
            let p = brighterscript.createToken(brighterscript.TokenKind.Public, 'public', target.range);
            let o = brighterscript.createToken(brighterscript.TokenKind.Override, 'override', target.range);
            let n = brighterscript.createIdentifier(name, target.range);
            let cms = new brighterscript.ClassMethodStatement(p, n, statement.func, o);
            target.body.push(cms);
            return true;
        }

    }
    error = diagnostics?.length > 0 ? diagnostics[0].message : 'unknown error';
    diagnosticCorruptTestProduced(file, annotation, error, funcSource);
    return false;
}

export function changeClassMethodBody(target: ClassStatement, name: string, source: Statement[] | string): boolean {
    let method = target.methods.find((m) => m.name.text === name);
    if (brighterscript.isClassMethodStatement(method)) {
        changeFunctionBody(method, source);
        return true;
    }
    return false;
}

export function sanitizeBsJsonString(text: string) {
    return `"${text ? text.replace(/"/g, '\'') : ''}"`;
}

export function createIfStatement(condition: Expression, statements: Statement[]): brighterscript.IfStatement {
    let ifToken = brighterscript.createToken(brighterscript.TokenKind.If, 'if', brighterscript.Range.create(1, 1, 1, 999999));
    let thenBranch = new brighterscript.Block(statements, brighterscript.Range.create(1, 1, 1, 1));
    return new brighterscript.IfStatement({ if: ifToken, then: brighterscript.createToken(brighterscript.TokenKind.Then, '', brighterscript.Range.create(1, 1, 1, 999999)) }, condition, thenBranch);
}

export function createVarExpression(varName: string, operator: brighterscript.TokenKind, value: string): brighterscript.BinaryExpression {
    let variable = createVariableExpression(varName, brighterscript.Range.create(1, 1, 1, 999999));
    let v = brighterscript.createStringLiteral(value, brighterscript.Range.create(1, 1, 1, 999999));

    let t = brighterscript.createToken(operator, getTokenText(operator), brighterscript.Range.create(1, 1, 1, 999999));
    return new brighterscript.BinaryExpression(variable, t, v);
}

export function getTokenText(operator: brighterscript.TokenKind): string {
    switch (operator) {
        case brighterscript.TokenKind.Equal:
            return '=';
        case brighterscript.TokenKind.Plus:
            return '+';
        case brighterscript.TokenKind.Minus:
            return '-';
        case brighterscript.TokenKind.Less:
            return '<';
        case brighterscript.TokenKind.Greater:
            return '>';
        default:
            return '';
    }
}
