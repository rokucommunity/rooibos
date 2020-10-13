import { BinaryExpression, Block, ClassMethodStatement, ClassStatement, createIdentifier, createStringLiteral, createToken, ElseIf, Expression, FunctionStatement, isClassMethodStatement, isClassStatement, Lexer, ParseMode, Parser, Position, Statement, TokenKind, Range } from 'brighterscript';

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
  while (matches = regex.exec(input)) {
    values.push(matches[groupIndex]);
  }
  return values;
}
export function getRegexMatchValue(input, regex, groupIndex): string {
  let matches: any[];
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
  let tokens = Lexer.scan(source).tokens;
  let { statements, diagnostics } = Parser.parse(tokens, { mode: ParseMode.BrighterScript });
  if (statements && statements.length > 0) {
    return statements[0] as FunctionStatement;
  }
  return undefined;
}

export function getFunctionBody(source: string): Statement[] {
  let funcStatement = makeASTFunction(source);
  return funcStatement ? funcStatement.func.body.statements : [];
}

export function changeFunctionBody(statement: FunctionStatement | ClassMethodStatement, source: string | Statement[]) {
  let statements = statement.func.body.statements;
  statements.splice(0, statements.length);
  let newStatements = (typeof source === 'string') ? getFunctionBody(source) : source;
  for (let newStatement of newStatements) {
    statements.push(newStatement);
  }
}

export function addOverriddenMethod(target: ClassStatement, name: string, source: string): boolean {
  let statement = makeASTFunction(`
  class wrapper
  override function ${name}()
    ${source}
  end function
  end class
  `);
  if (isClassStatement(statement)) {
    let classStatement = statement as ClassStatement;
    target.body.push(classStatement.methods[0]);
    return true;
  }
  return false;
}

export function changeClassMethodBody(target: ClassStatement, name: string, source: string | Statement[]): boolean {
  let method = target.methods.find((m) => m.name.text === name);
  if (isClassMethodStatement(method)) {
    changeFunctionBody(method, source);
    return true;
  }
  return false;
}

export function sanitizeBsJsonString(text: string) {
  return `"${text ? text.replace(/"/g, '\'') : ''}"`;
}

export function createElseIf(condition: Expression, statements: Statement[]): ElseIf {
  let elseIfToken = createToken(TokenKind.ElseIf, Position.create(1, 1));
  elseIfToken.text = 'else if';

  return {
    condition: condition,
    thenBranch: new Block(statements, Range.create(1, 1, 1, 1)),
    thenToken: createToken(TokenKind.Then, Position.create(1, 1)),
    elseIfToken: elseIfToken
  };
}

export function createVarExpression(varName: string, operator: TokenKind, value: string): BinaryExpression {
  let variable = createIdentifier(varName, Position.create(1, 1));
  let v = createStringLiteral(value, Position.create(1, 1));

  let t = createToken(operator, Position.create(1, 1));
  t.text = getTokenText(operator);
  return new BinaryExpression(variable, t, v);
}

export function getTokenText(operator: TokenKind): string {
  switch (operator) {
    case TokenKind.Equal:
      return '=';
    case TokenKind.Plus:
      return '+';
    case TokenKind.Minus:
      return '-';
    case TokenKind.Less:
      return '<';
    case TokenKind.Greater:
      return '>';
  }
  return '';
}