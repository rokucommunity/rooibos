import type { CallExpression, DottedGetExpression } from 'brighterscript';
import { ArrayLiteralExpression, createInvalidLiteral, createStringLiteral, createToken, isDottedGetExpression, TokenKind } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
import { TranspileState } from 'brighterscript/dist/parser/TranspileState';
import { diagnosticErrorProcessingFile } from '../utils/Diagnostics';
import type { RooibosAnnotation } from './Annotation';
import { RawCodeStatement } from './RawCodeStatement';
import type { TestCase } from './TestCase';
import type { TestSuite } from './TestSuite';
import { TestBlock } from './TestSuite';
import { sanitizeBsJsonString } from './Utils';

export class TestGroup extends TestBlock {

    constructor(testSuite: TestSuite, annotation: RooibosAnnotation) {
        super(annotation);
        this.testSuite = testSuite;
        this.setupFunctionName = this.setupFunctionName || this.testSuite.setupFunctionName;
        this.tearDownFunctionName = this.tearDownFunctionName || this.testSuite.tearDownFunctionName;
        this.beforeEachFunctionName = this.beforeEachFunctionName || this.testSuite.beforeEachFunctionName;
        this.afterEachFunctionName = this.afterEachFunctionName || this.testSuite.afterEachFunctionName;
    }

    public testSuite: TestSuite;
    public testCases = new Map<string, TestCase>();
    public ignoredTestCases: TestCase[] = [];
    public soloTestCases: TestCase[] = [];

    public addTestCase(testCase: TestCase) {

        this.testCases.set(testCase.name + (testCase.isParamTest ? testCase.paramTestIndex.toString() : ''), testCase);

        if (testCase.isIgnored) {
            this.ignoredTestCases.push(testCase);
            this.hasIgnoredTests = true;
        } else if (testCase.isSolo) {
            this.hasSoloTests = true;
            this.soloTestCases.push(testCase);
        }
    }

    public getTestCases(): TestCase[] {
        return [...this.testCases.values()];
    }

    public modifyAssertions(testCase: TestCase, noEarlyExit: boolean) {
        //for each method
        //if assertion
        //wrap with if is not fail
        //add line number as last param
        const transpileState = new BrsTranspileState(this.file);
        try {
            let func = this.testSuite.classStatement.methods.find((m) => m.name.text.toLowerCase() === testCase.funcName.toLowerCase());
            func.walk(brighterscript.createVisitor({
                ExpressionStatement: (expressionStatement) => {
                    let callExpression = expressionStatement.expression as CallExpression;
                    if (brighterscript.isCallExpression(callExpression) && brighterscript.isDottedGetExpression(callExpression.callee)) {
                        let dge = callExpression.callee;
                        let assertRegex = /(?:fail|assert(?:[a-z0-9]*)|expect(?:[a-z0-9]*)|stubCall)/i;
                        if (dge && assertRegex.test(dge.name.text)) {
                            if (dge.name.text === 'stubCall') {
                                this.modifyModernRooibosExpectCallExpression(callExpression);
                                return expressionStatement;

                            } else {

                                if (dge.name.text === 'expectCalled' || dge.name.text === 'expectNotCalled') {
                                    this.modifyModernRooibosExpectCallExpression(callExpression);
                                }
                                return new RawCodeStatement(`
                                m.currentAssertLineNumber = ${callExpression.range.start.line}
                                ${callExpression.transpile(transpileState).join('')}
                                ${noEarlyExit ? '' : 'if m.currentResult.isFail then return invalid'}
                                `, this.file, callExpression.range);
                            }
                        }
                    }
                }
            }), {
                walkMode: brighterscript.WalkMode.visitStatementsRecursive
            });
        } catch (e) {
            // console.log(e);
            diagnosticErrorProcessingFile(this.testSuite.file, e.message);
        }
    }

    private modifyModernRooibosExpectCallExpression(callExpression: CallExpression) {
        let isNotCalled = false;
        let isStubCall = false;
        if (isDottedGetExpression(callExpression.callee)) {
            const nameText = callExpression.callee.name.text;
            callExpression.callee.name.text = `_${nameText}`;
            isNotCalled = nameText === 'expectNotCalled';
            isStubCall = nameText === 'stubCall';
        }
        //modify args
        let arg0 = callExpression.args[0];
        if (brighterscript.isCallExpression(arg0) && isDottedGetExpression(arg0.callee)) {
            let functionName = arg0.callee.name.text;
            callExpression.args.shift();
            if (!isNotCalled && !isStubCall) {
                const expectedArgs = new ArrayLiteralExpression(arg0.args, createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                callExpression.args.unshift(expectedArgs);
            }
            callExpression.args.unshift(createStringLiteral(functionName));
            callExpression.args.unshift(arg0.callee.obj);
        } else if (brighterscript.isDottedGetExpression(arg0)) {
            let functionName = arg0.name.text;
            arg0 = callExpression.args.shift() as DottedGetExpression;
            if (!isNotCalled && !isStubCall) {
                callExpression.args.unshift(createInvalidLiteral());
            }
            callExpression.args.unshift(createStringLiteral(functionName));
            callExpression.args.unshift((arg0 as DottedGetExpression).obj);
        } else if (brighterscript.isCallfuncExpression(arg0)) {
            let functionName = arg0.methodName.text;
            callExpression.args.shift();
            if (isNotCalled || isStubCall) {
                //TODO in future we can improve is notCalled to know which callFunc function it is
                // const expectedArgs = new ArrayLiteralExpression([createStringLiteral(functionName)], createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                // callExpression.args.unshift(expectedArgs);
            } else {
                const expectedArgs = new ArrayLiteralExpression([createStringLiteral(functionName), ...arg0.args], createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                callExpression.args.unshift(expectedArgs);
            }
            callExpression.args.unshift(createStringLiteral('callFunc'));
            callExpression.args.unshift(arg0.callee);
        }
    }

    public asText(): string {
        let testCaseText = [...this.testCases.values()].filter((tc) => tc.isIncluded).map((tc) => tc.asText());

        return `
            {
                name: ${sanitizeBsJsonString(this.name)}
                isSolo: ${this.isSolo}
                isIgnored: ${this.isIgnored}
                filename: "${this.pkgPath}"
                lineNumber: "${this.annotation.annotation.range.start.line}"
                setupFunctionName: "${this.setupFunctionName || ''}"
                tearDownFunctionName: "${this.tearDownFunctionName || ''}"
                beforeEachFunctionName: "${this.beforeEachFunctionName || ''}"
                afterEachFunctionName: "${this.afterEachFunctionName || ''}"
                testCases: [${testCaseText.join(',\n')}]
            }`;
    }

}
