import * as chai from 'chai';
const expect = chai.expect;
import type { TestCase } from './lib/rooibos/TestCase';
import { FunctionStatement, Parser, standardizePath as s } from 'brighterscript';
import type { BsDiagnostic, CodeDescription, DiagnosticRelatedInformation, DiagnosticSeverity, DiagnosticTag, ParseOptions } from 'brighterscript';
import type { Range } from 'vscode-languageserver';
import * as fsExtra from 'fs-extra';
import undent from 'undent';

const tmpPath = s`${process.cwd()}/.tmp`;
const _stagingFolderPath = s`${tmpPath}/staging`;

export const TestCaseMD5Sum = `0d635a9477c4624180ef87bef352afd3`;

const TestCaseFunctionNameRegex = new RegExp(`^rooiboos_test_case_${TestCaseMD5Sum}_`);

export function expectTestCaseFunctionName(testCase: TestCase, index: number) {
    expect(testCase.funcName).to.match(new RegExp(TestCaseFunctionNameRegex.source + index + '$'));
}


type DiagnosticCollection = { getDiagnostics(): Array<BsDiagnostic> } | { diagnostics: BsDiagnostic[] } | BsDiagnostic[];
export interface PartialDiagnostic {
    range?: Range;
    severity?: DiagnosticSeverity;
    code?: number | string;
    codeDescription?: Partial<CodeDescription>;
    source?: string;
    message?: string;
    tags?: Partial<DiagnosticTag>[];
    relatedInformation?: Partial<DiagnosticRelatedInformation>[];
    data?: unknown;
    uri?: string;
}

export function expectDiagnostics(diagnostics: DiagnosticCollection, expected: Array<PartialDiagnostic>) {
    const actualDiagnostics = getActualDiagnostics(diagnostics);

    expect(actualDiagnostics).to.have.length(expected.length);
    expected.forEach((expectedDiagnostic, index) => {
        const actualDiagnostic = actualDiagnostics[index];
        if (expectedDiagnostic.uri) {
            expect(actualDiagnostic.location?.uri).to.equal(expectedDiagnostic.uri);
        }
        if (expectedDiagnostic.code) {
            expect(actualDiagnostic.code).to.equal(expectedDiagnostic.code);
        }
        if (expectedDiagnostic.range) {
            const actualRange = actualDiagnostic.location?.range;
            expect(actualRange).to.exist;
            expect(actualRange.start.line).to.equal(expectedDiagnostic.range.start.line);
            expect(actualRange.start.character).to.equal(expectedDiagnostic.range.start.character);
            expect(actualRange.end.line).to.equal(expectedDiagnostic.range.end.line);
            expect(actualRange.end.character).to.equal(expectedDiagnostic.range.end.character);
        }
        if (expectedDiagnostic.message) {
            expect(actualDiagnostic.message).to.equal(expectedDiagnostic.message);
        }
    });
}

function getActualDiagnostics(diagnostics: DiagnosticCollection): Array<BsDiagnostic> {
    if ('getDiagnostics' in diagnostics) {
        return diagnostics.getDiagnostics();
    } else if ('diagnostics' in diagnostics) {
        return diagnostics.diagnostics;
    } else {
        return diagnostics;
    }
}

function getSortedActualDiagnostics(diagnostics: DiagnosticCollection): Array<BsDiagnostic> {
    const diags = getActualDiagnostics(diagnostics);
    return diags.sort((a, b) => {
        return a.code.toString().localeCompare(b.code.toString()) ||
            a.message.localeCompare(b.message) ||
            a.location.range.start.line - b.location.range.start.line ||
            a.location.range.start.character - b.location.range.start.character;
    });
}

export function expectZeroDiagnostics(diagnostics: DiagnosticCollection) {
    const actualDiagnostics = getSortedActualDiagnostics(diagnostics);
    expect(actualDiagnostics).to.be.empty;
}

export function getContents(filename: string) {
    if (!filename.includes('/')) {
        filename = `source/${filename}`;
    }
    return undent(
        fsExtra.readFileSync(s`${_stagingFolderPath}/${filename}`).toString()
    );
}

export function getAstFromFileContents(contents: string, options?: ParseOptions) {
    const parser = new Parser();
    const { ast } = parser.parse(contents, options);
    return ast;
}


export function expectFunctionContents(fileContents: string, functionName: string, expectedContents: string) {
    const contents = getFunctionContents(fileContents, functionName);
    if (contents) {
        expect(undent(contents)).to.equal(undent(expectedContents));
    }
}

function normalizeFunctionContentsForContains(value: string) {
    return undent(value).replace(/\s+/g, ' ').trim();
}

export function expectFunctionContentsContains(fileContents: string, functionName: string, expectedContents: string) {
    const contents = getFunctionContents(fileContents, functionName);
    expect(contents, `Function not found: '${functionName}'`).to.not.equal('');
    if (contents) {
        expect(normalizeFunctionContentsForContains(contents)).to.contain(normalizeFunctionContentsForContains(expectedContents));
    }
}

export interface TestFunctionContentsOptions {
    className?: string;
    index?: number;
    testFile?: string;
}

function normalizeTestFunctionContentsOptions(options: TestFunctionContentsOptions = {}) {
    return {
        className: options.className ?? 'ATest',
        index: options.index ?? 0,
        testFile: options.testFile ?? 'test.spec.brs'
    };
}

export function getTestFunctionContents(options?: TestFunctionContentsOptions) {
    const { className, index, testFile } = normalizeTestFunctionContentsOptions(options);
    const contents = getContents(testFile);
    const funcNameRegex = new RegExp(`__${className}_method_rooiboos_test_case_.*_${index}`);

    return getFunctionContents(contents, funcNameRegex);
}

export function expectTestFunctionContents(expectedContents: string, options?: TestFunctionContentsOptions) {
    const contents = getTestFunctionContents(options);
    expect(contents, 'Test function not found').to.not.equal('');
    if (contents) {
        expect(undent(contents)).to.equal(undent(expectedContents));
    } else {

    }
}

export function getFunctionContents(rawCode: string, functionName: RegExp | string) {
    const ast = getAstFromFileContents(rawCode);
    const funcStmt = ast.statements.find((stmt) => {
        return stmt instanceof FunctionStatement && (typeof functionName === 'string' ? stmt.tokens.name.text === functionName : functionName.test(stmt.tokens.name.text));
    }) as FunctionStatement | undefined;

    const bodyRange = funcStmt?.func.body.location?.range;
    if (bodyRange) {
        const lines = rawCode.split(/\r?\n/);
        const extractedLines = lines.slice(bodyRange.start.line, bodyRange.end.line + 1);
        return undent(extractedLines.join('\n'));
    }

    return '';
}


export function normalizeGeneratedMockFunctionNames(text: string) {
    return text.replace(/RBS_SM_[0-9]+_getMocksByFunctionName/g, 'RBS_SM_getMocksByFunctionName');
}

export function getFunctionAstNode(rawCode: string, functionName: RegExp | string) {
    const ast = getAstFromFileContents(rawCode);
    return ast.statements.find((stmt) => {
        return stmt instanceof FunctionStatement && (typeof functionName === 'string' ? stmt.tokens.name.text === functionName : functionName.test(stmt.tokens.name.text));
    }) as FunctionStatement | undefined;
}
