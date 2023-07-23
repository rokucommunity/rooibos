import type { AstEditor, CallExpression, DottedGetExpression, Expression } from 'brighterscript';
import { isCallExpression, isCallfuncExpression, isIndexedGetExpression, ArrayLiteralExpression, createInvalidLiteral, createStringLiteral, createToken, isDottedGetExpression, TokenKind, isLiteralExpression, isVariableExpression } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
import { TranspileState } from 'brighterscript/dist/parser/TranspileState';
import { diagnosticErrorProcessingFile } from '../utils/Diagnostics';
import type { RooibosAnnotation } from './Annotation';
import { RawCodeStatement } from './RawCodeStatement';
import type { TestCase } from './TestCase';
import type { TestSuite } from './TestSuite';
import { TestBlock } from './TestSuite';
import { overrideAstTranspile, sanitizeBsJsonString } from './Utils';
import undent from 'undent';

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
            this.hasAsyncTests = testCase.isAsync;
        } else {
            this.hasAsyncTests = testCase.isAsync;
        }

    }

    public getTestCases(): TestCase[] {
        return [...this.testCases.values()];
    }

    public modifyAssertions(testCase: TestCase, noEarlyExit: boolean, editor: AstEditor) {
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
                                this.modifyModernRooibosExpectCallExpression(callExpression, editor);
                                return expressionStatement;

                            } else {

                                if (dge.name.text === 'expectCalled' || dge.name.text === 'expectNotCalled') {
                                    this.modifyModernRooibosExpectCallExpression(callExpression, editor);
                                }
                                //TODO change this to editor.setProperty(parentObj, parentKey, new SourceNode()) once bsc supports it
                                overrideAstTranspile(editor, expressionStatement, '\n' + undent`
                                    m.currentAssertLineNumber = ${callExpression.range.start.line}
                                    ${callExpression.transpile(transpileState).join('')}
                                    ${noEarlyExit ? '' : 'if m.currentResult?.isFail = true then m.done() : return invalid'}
                                ` + '\n');
                            }
                        }
                    }
                }
            }), {
                walkMode: brighterscript.WalkMode.visitStatementsRecursive
            });
        } catch (e) {
            // console.log(e);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            diagnosticErrorProcessingFile(this.testSuite.file, e.message);
        }
    }

    private modifyModernRooibosExpectCallExpression(callExpression: CallExpression, editor: AstEditor) {
        let isNotCalled = false;
        let isStubCall = false;
        if (isDottedGetExpression(callExpression.callee)) {
            const nameText = callExpression.callee.name.text;
            editor.setProperty(callExpression.callee.name, 'text', `_${nameText}`);
            isNotCalled = nameText === 'expectNotCalled';
            isStubCall = nameText === 'stubCall';
        }
        //modify args
        let arg0 = callExpression.args[0];
        if (brighterscript.isCallExpression(arg0) && isDottedGetExpression(arg0.callee)) {
            let functionName = arg0.callee.name.text;
            let fullPath = this.getStringPathFromDottedGet(arg0.callee.obj as DottedGetExpression);
            editor.removeFromArray(callExpression.args, 0);
            if (!isNotCalled && !isStubCall) {
                const expectedArgs = new ArrayLiteralExpression(arg0.args, createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                editor.addToArray(callExpression.args, 0, expectedArgs);
            }
            editor.addToArray(callExpression.args, 0, fullPath ?? createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, this.getRootObjectFromDottedGet(arg0.callee));
            editor.addToArray(callExpression.args, 0, createStringLiteral(functionName));
            editor.addToArray(callExpression.args, 0, arg0.callee.obj);
        } else if (brighterscript.isDottedGetExpression(arg0)) {
            let functionName = arg0.name.text;
            let fullPath = this.getStringPathFromDottedGet(arg0.obj as DottedGetExpression);
            arg0 = callExpression.args[0] as DottedGetExpression;
            editor.removeFromArray(callExpression.args, 0);
            if (!isNotCalled && !isStubCall) {
                editor.addToArray(callExpression.args, 0, createInvalidLiteral());
            }
            editor.addToArray(callExpression.args, 0, fullPath ?? createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, this.getRootObjectFromDottedGet(arg0 as DottedGetExpression));
            editor.addToArray(callExpression.args, 0, createStringLiteral(functionName));
            editor.addToArray(callExpression.args, 0, (arg0 as DottedGetExpression).obj);
        } else if (brighterscript.isCallfuncExpression(arg0)) {
            let functionName = arg0.methodName.text;
            editor.removeFromArray(callExpression.args, 0);
            if (isNotCalled || isStubCall) {
                //TODO in future we can improve is notCalled to know which callFunc function it is
                // const expectedArgs = new ArrayLiteralExpression([createStringLiteral(functionName)], createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                // editor.addToArray(callExpression.args, 0, expectedArgs);
            } else {
                const expectedArgs = new ArrayLiteralExpression([createStringLiteral(functionName), ...arg0.args], createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                editor.addToArray(callExpression.args, 0, expectedArgs);
            }
            let fullPath = this.getStringPathFromDottedGet(arg0.callee as DottedGetExpression);
            editor.addToArray(callExpression.args, 0, fullPath ?? createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, this.getRootObjectFromDottedGet(arg0.callee as DottedGetExpression));
            editor.addToArray(callExpression.args, 0, createStringLiteral('callFunc'));
            editor.addToArray(callExpression.args, 0, arg0.callee);
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

    private getStringPathFromDottedGet(value: DottedGetExpression) {
        let parts = [this.getPathValuePartAsString(value)];
        let root;
        root = value.obj;
        while (root) {
            if (isCallExpression(root) || isCallfuncExpression(root)) {
                return undefined;
            }
            parts.push(`${this.getPathValuePartAsString(root)}`);
            root = root.obj;
        }
        let joinedParts = parts.reverse().join('.');
        return joinedParts === '' ? undefined : createStringLiteral(joinedParts);
    }


    private getPathValuePartAsString(expr: Expression) {
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

    private getRootObjectFromDottedGet(value: DottedGetExpression) {
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

}
