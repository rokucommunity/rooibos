import type { BrsFile, ClassStatement, FunctionStatement, Statement, BscFile, AnnotationExpression, BsDiagnostic } from 'brighterscript';
import { DiagnosticSeverity, Range, util } from 'brighterscript';

import type { AnnotationType, RooibosAnnotation } from '../rooibos/Annotation';

function addDiagnostic(
    file: BrsFile,
    code: number,
    message: string,
    startLine = 0,
    startCol = 0,
    endLine = -1,
    endCol = 99999,
    severity: DiagnosticSeverity = DiagnosticSeverity.Error
) {
    endLine = endLine === -1 ? startLine : endLine;
    file.program.diagnostics.register(
        createDiagnostic(file, code, message, startLine, startCol, endLine, endCol, severity),
        { tags: ['rooibos'] }
    );
}

function addDiagnosticForStatement(
    file: BrsFile,
    code: number,
    message: string,
    statement: Statement,
    severity: DiagnosticSeverity = DiagnosticSeverity.Error
) {
    let line = statement.location.range.start.line;
    let col = statement.location.range.start.character;
    file.program.diagnostics.register(
        createDiagnostic(file, code, message, line, col, line, 999999, severity),
        { tags: ['rooibos'] }
    );
}

function addDiagnosticForAnnotation(
    file: BrsFile,
    code: number,
    message: string,
    annotation: AnnotationExpression,
    severity: DiagnosticSeverity = DiagnosticSeverity.Error,
    endChar?: number
) {
    let line = annotation.location.range.start.line;
    let col = annotation.location.range.start.character;

    file.program.diagnostics.register(
        createDiagnostic(file, code, message, line, col, annotation.location.range.end.line, annotation.location.range.end.character + 9999, severity),
        { tags: ['rooibos'] }
    );
}

function createDiagnostic(
    bscFile: BscFile,
    code: number,
    message: string,
    startLine = 0,
    startCol = 99999,
    endLine = 0,
    endCol = 99999,
    severity: DiagnosticSeverity = DiagnosticSeverity.Error
): BsDiagnostic {
    const diagnostic = {
        code: `RBS${code}`,
        message: message,
        location: util.createLocationFromFileRange(bscFile, Range.create(startLine, startCol, endLine, endCol)),
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

export function diagnosticNoGroup(file: BrsFile, statement: Statement, annotationType: AnnotationType) {
    addDiagnosticForStatement(
        file,
        2201,
        `Cannot process ${annotationType} of a test group`,
        statement
    );
}

export function diagnosticWrongParameterCount(file: BrsFile, statement: FunctionStatement, expectedParamCount = 0) {
    addDiagnosticForStatement(
        file,
        2202,
        `Function ${statement.tokens.name} defined with wrong number of params: expected ${expectedParamCount}`,
        statement
    );
}

export function diagnosticDuplicateSuite(file: BrsFile, statement: ClassStatement, annotation: RooibosAnnotation) {
    addDiagnosticForStatement(
        file,
        2203,
        `Test suite already declared with name: ${annotation.name}. This test suite will be skipped.`,
        statement
    );
}

export function diagnosticTestAnnotationOutsideOfGroup(file: BrsFile, statement: ClassStatement, annotation: RooibosAnnotation) {
    addDiagnosticForStatement(
        file,
        2204,
        `Found Group, when a test function was expected`,
        statement
    );
}

export function diagnosticIllegalParams(file: BrsFile, annotation: AnnotationExpression) {
    addDiagnosticForAnnotation(
        file,
        2205,
        `Could not parse params for test.`,
        annotation
    );
}

export function diagnosticWrongTestParameterCount(file: BrsFile, annotation: AnnotationExpression, gotCount = 0, expectedParamCount = 0) {
    addDiagnosticForAnnotation(
        file,
        2206,
        `Params for test do not match arg count on method. Got ${gotCount} expected ${expectedParamCount}`,
        annotation
    );
}

export function diagnosticNodeTestRequiresNode(file: BrsFile, annotation: AnnotationExpression) {
    addDiagnosticForAnnotation(
        file,
        2207,
        `Node name must be declared for a node test. This is the component that the generated test will extend.`,
        annotation
    );
}

export function diagnosticNodeTestIllegalNode(file: BrsFile, annotation: AnnotationExpression, nodeName: string) {
    addDiagnosticForAnnotation(
        file,
        2208,
        `Component ${nodeName}, is not found in this project. Node tests generate a new component that extends the component you wish to test. Please make sure that component exists and compiles.`,
        annotation
    );
}

export function diagnosticGroupWithNameAlreadyDefined(file: BrsFile, annotation: RooibosAnnotation) {
    addDiagnosticForAnnotation(
        file,
        2209,
        `Test group with name ${annotation.name}, is already declared in this suite. Ignoring`,
        annotation.annotation
    );
}

export function diagnosticTestWithNameAlreadyDefined(annotation: RooibosAnnotation) {
    addDiagnosticForAnnotation(
        annotation.file,
        2210,
        `Test with name ${annotation.name}, is already declared in this group. Ignoring`,
        annotation.annotation
    );
}

export function diagnosticIncompatibleAnnotation(annotation: RooibosAnnotation) {
    addDiagnosticForAnnotation(
        annotation.file,
        2211,
        `Was expecting a function, got a test annotation`,
        annotation.annotation
    );
}

export function diagnosticErrorProcessingFile(file: BrsFile, message: string) {
    addDiagnostic(
        file,
        2212,
        `General error : ` + message
    );
}

export function diagnosticErrorNoMainFound(file: BrsFile) {
    addDiagnostic(
        file,
        2213,
        `Could not find main function to inject rooibos launch code. Rooibos has added one for you`, 1, 1, 1, 1, DiagnosticSeverity.Warning
    );
}

export function diagnosticEmptyGroup(file: BrsFile, annotation: RooibosAnnotation) {
    addDiagnosticForAnnotation(
        file,
        2214,
        `Test group with name ${annotation.name}, empty.`,
        annotation.annotation
    );
}

export function diagnosticNoTestFunctionDefined(file: BrsFile, annotation: RooibosAnnotation) {
    addDiagnosticForAnnotation(
        file,
        2215,
        `Multiple test annotations per function are not allowed. ${annotation.name || ''}`,
        annotation.annotation
    );
}

export function diagnosticTestWithArgsButNoParams(file: BrsFile, annotation: AnnotationExpression, gotCount = 0) {
    addDiagnosticForAnnotation(
        file,
        2216,
        `Test method signature has arguments; but test has no paremeters. Got ${gotCount} args: expected 0. Did you forget your @params annotations?`,
        annotation
    );
}


export function diagnosticNoTestNameDefined(file: BrsFile, annotation: AnnotationExpression) {
    addDiagnosticForAnnotation(
        file,
        2217,
        `It annotation requires a name  `,
        annotation
    );
}

export function diagnosticMultipleDescribeAnnotations(file: BrsFile, annotation: AnnotationExpression) {
    addDiagnosticForAnnotation(
        file,
        2218,
        `Found multiple @describe annotations. Did you forget to write some tests?`,
        annotation
    );
}

export function diagnosticMultipleTestOnFunctionDefined(file: BrsFile, annotation: AnnotationExpression) {
    addDiagnosticForAnnotation(
        file,
        2219,
        `Found multiple @it annotations. Did you forget to write some tests?`,
        annotation
    );
}

export function diagnosticCorruptTestProduced(file: BrsFile, annotation: AnnotationExpression, error: string, source: string) {
    addDiagnosticForAnnotation(
        file,
        2220,
        `The test resulted in a corrupt data file. This is typically because one of the param tests resulted in a failed transpilation. Please raise an issue with as much of your test file as possible to reproduce the issue.\n ${error} \n ${source} `,
        annotation
    );
}

export function diagnosticNoStagingDir(file: BrsFile) {
    addDiagnostic(
        file,
        2221,
        `The bsconfig must define stagingDir, or the deprecated stagingFolderPath options`, 1, 1, 1, 1, DiagnosticSeverity.Error
    );
}

