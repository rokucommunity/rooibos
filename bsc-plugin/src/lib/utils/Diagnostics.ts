import { BrsFile, ClassStatement, DiagnosticSeverity, FunctionStatement, Statement, Token, XmlFile, Range, BscFile } from 'brighterscript';

import { Annotation } from '../rooibos/Annotation';

function addDiagnostic(
  file: BscFile,
  code: number,
  message: string,
  startLine: number = 0,
  startCol: number = 0,
  endLine: number = -1,
  endCol: number = 99999,
  severity: DiagnosticSeverity = DiagnosticSeverity.Error
) {
  endLine = endLine === -1 ? startLine : endLine;
  file.addDiagnostics([createDiagnostic(file, code, message, startLine, startCol, endLine, endCol, severity)]);
}

function addDiagnosticForStatement(
  file: BrsFile,
  code: number,
  message: string,
  statement: Statement,
  severity: DiagnosticSeverity = DiagnosticSeverity.Error
) {
  let line = statement.range.start.line;
  let col = statement.range.start.character;
  file.addDiagnostics([createDiagnostic(file, code, message, line, col, line, 999999, severity)]);
}

function addDiagnosticForToken(
  file: BscFile,
  code: number,
  message: string,
  token: Token,
  severity: DiagnosticSeverity = DiagnosticSeverity.Error,
  endChar?: number
) {
  let line = token.range.start.line;
  let col = token.range.start.character;
  file.addDiagnostics([createDiagnostic(file, code, message, line, col, line, endChar || token.range.end.character, severity)]);
}

function createDiagnostic(
  bscFile: BscFile,
  code: number,
  message: string,
  startLine: number = 0,
  startCol: number = 99999,
  endLine: number = 0,
  endCol: number = 99999,
  severity: DiagnosticSeverity = DiagnosticSeverity.Error
) {
  const diagnostic = {
    code: code,
    message: message,
    range: Range.create(startLine, startCol, endLine, endCol),
    file: bscFile,
    severity: severity
  };
  return diagnostic;
}

/**
 * Public methods
 */

export function diagnosticWrongAnnotation(file: BrsFile, statement: Statement, message: string) {
  addDiagnosticForStatement(
    file,
    2200,
    'Wrong kind of annotation.' + message,
    statement
  );
}

export function diagnosticNoGroup(file: BrsFile, statement: Statement) {
  addDiagnosticForStatement(
    file,
    2201,
    'Found test outside of a test group',
    statement
  );
}

export function diagnosticWrongParameterCount(file: BrsFile, statement: FunctionStatement, expectedParamCount = 0) {
  addDiagnosticForStatement(
    file,
    2202,
    `Function ${statement.name} defined with wrong number of params: expected ${expectedParamCount}`,
    statement
  );
}

export function diagnosticDuplicateSuite(file: BrsFile, statement: ClassStatement, annotation: Annotation) {
  addDiagnosticForStatement(
    file,
    2203,
    `Test suite already declared with name: ${annotation.name}. This test suite will be skipped.`,
    statement
  );
}

export function diagnosticTestAnnotationOutsideOfGroup(file: BrsFile, statement: ClassStatement, annotation: Annotation) {
  addDiagnosticForStatement(
    file,
    2204,
    `Found Group, when a test function was expected`,
    statement
  );
}

export function diagnosticIllegalParams(file: BrsFile, token: Token) {
  addDiagnosticForToken(
    file,
    2205,
    `Could not parse params for test.`,
    token
  );
}

export function diagnosticWrongTestParameterCount(file: BrsFile, token: Token, gotCount = 0, expectedParamCount = 0) {
  addDiagnosticForToken(
    file,
    2206,
    `Params for test do not match arg count on method. Got ${gotCount} expected ${expectedParamCount}`,
    token
  );
}

export function diagnosticNodeTestRequiresNode(file: BrsFile, token: Token) {
  addDiagnosticForToken(
    file,
    2207,
    `Node name must be declared for a node test. This is the component that the generated test will extend.`,
    token
  );
}

export function diagnosticNodeTestIllegalNode(file: BrsFile, token: Token, nodeName: string) {
  addDiagnosticForToken(
    file,
    2208,
    `Component ${nodeName}, is not found in this project. Node tests generate a new component that extends the component you wish to test. Please make sure that component exists and compiles.`,
    token
  );
}
export function diagnosticGroupWithNameAlreadyDefined(file: BrsFile, annotation: Annotation) {
  addDiagnosticForToken(
    file,
    2209,
    `Test group with name ${annotation.name}, is already declared in this suite. Ignoring`,
    annotation.token
  );
}

export function diagnosticTestWithNameAlreadyDefined(annotation: Annotation) {
  addDiagnosticForToken(
    annotation.file,
    2210,
    `Test with name ${annotation.name}, is already declared in this group. Ignoring`,
    annotation.token
  );
}

export function diagnosticIncompatibleAnnotation(annotation: Annotation) {
  addDiagnosticForToken(
    annotation.file,
    2211,
    `Was expecting a function, got a test annotation`,
    annotation.token
  );
}

export function diagnosticErrorProcessingFile(file: BrsFile, message: string) {
  addDiagnostic(
    file,
    2212,
    `General error : ` + message
  );
}

export function diagnosticErrorNoMainFound(file: BscFile) {
  addDiagnostic(
    file,
    2213,
    `Could not find main function to inject rooibos launch code. Please ensure your project has a main function`
  );
}
