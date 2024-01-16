import type { AstEditor, CallExpression, DottedGetExpression, NamespaceContainer } from 'brighterscript';
import { ArrayLiteralExpression, createInvalidLiteral, createStringLiteral, createToken, isDottedGetExpression, TokenKind, isFunctionExpression, Parser } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
import { diagnosticErrorProcessingFile } from '../utils/Diagnostics';
import type { RooibosAnnotation } from './Annotation';
import type { TestCase } from './TestCase';
import type { TestSuite } from './TestSuite';
import { TestBlock } from './TestSuite';
import { getAllDottedGetParts, getRootObjectFromDottedGet, getStringPathFromDottedGet, sanitizeBsJsonString } from './Utils';

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

    public modifyAssertions(testCase: TestCase, noEarlyExit: boolean, editor: AstEditor, namespaceLookup: Map<string, NamespaceContainer>) {
        //for each method
        //if assertion
        //wrap with if is not fail
        //add line number as last param
        const transpileState = new BrsTranspileState(this.file);
        try {
            let func = this.testSuite.classStatement.methods.find((m) => m.name.text.toLowerCase() === testCase.funcName.toLowerCase());
            func.walk(brighterscript.createVisitor({
                ExpressionStatement: (expressionStatement, parent, owner, key) => {
                    let callExpression = expressionStatement.expression as CallExpression;
                    if (brighterscript.isCallExpression(callExpression) && brighterscript.isDottedGetExpression(callExpression.callee)) {
                        let dge = callExpression.callee;
                        let isSub = isFunctionExpression(callExpression.parent.parent.parent) && callExpression.parent.parent.parent.functionType.kind === TokenKind.Sub;
                        let assertRegex = /(?:fail|assert(?:[a-z0-9]*)|expect(?:[a-z0-9]*)|stubCall)/i;
                        if (dge && assertRegex.test(dge.name.text)) {
                            if (dge.name.text === 'stubCall') {
                                this.modifyModernRooibosExpectCallExpression(callExpression, editor, namespaceLookup);
                                return expressionStatement;

                            } else {

                                if (dge.name.text === 'expectCalled' || dge.name.text === 'expectNotCalled') {
                                    this.modifyModernRooibosExpectCallExpression(callExpression, editor, namespaceLookup);
                                }
                                if (dge.name.text === 'expectCalled' || dge.name.text === 'expectNotCalled') {
                                    this.modifyModernRooibosExpectCallExpression(callExpression, editor, namespaceLookup);
                                }

                                if (!noEarlyExit) {
                                    const trailingLine = Parser.parse(`if m.currentResult?.isFail = true then m.done() : return ${isSub ? '' : 'invalid'}`).ast.statements[0];
                                    editor.arraySplice(owner, key + 1, 0, trailingLine);
                                }
                                const leadingLine = Parser.parse(`m.currentAssertLineNumber = ${callExpression.range.start.line}`).ast.statements[0];
                                editor.arraySplice(owner, key, 0, leadingLine);
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

    private modifyModernRooibosExpectCallExpression(callExpression: CallExpression, editor: AstEditor, namespaceLookup: Map<string, NamespaceContainer>) {
        let isNotCalled = false;
        let isStubCall = false;

        //modify args
        let arg0 = callExpression.args[0];
        let arg1 = callExpression.args[1];
        if (isDottedGetExpression(callExpression.callee)) {
            const nameText = callExpression.callee.name.text;
            isNotCalled = nameText === 'expectNotCalled';
            isStubCall = nameText === 'stubCall';

            if (isStubCall && !brighterscript.isCallExpression(arg0)) {
                return;
            }
            editor.setProperty(callExpression.callee.name, 'text', `_${nameText}`);
        }

        if (brighterscript.isCallExpression(arg0) && isDottedGetExpression(arg0.callee)) {

            //is it a namespace?
            let dg = arg0.callee;
            let nameParts = getAllDottedGetParts(dg);
            let name = nameParts.pop();

            if (name) {
                //is a namespace?
                if (nameParts[0] && namespaceLookup.has(nameParts[0].toLowerCase())) {
                    //then this must be a namespace method
                    let fullPathName = nameParts.join('.').toLowerCase();
                    let ns = namespaceLookup.get(fullPathName);
                    if (!ns) {
                        //TODO this is an error condition!
                    }
                    nameParts.push(name);
                    let functionName = nameParts.join('_').toLowerCase();
                    editor.removeFromArray(callExpression.args, 0);
                    if (!isNotCalled && !isStubCall) {
                        const expectedArgs = new ArrayLiteralExpression(arg0.args, createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                        editor.addToArray(callExpression.args, 0, expectedArgs);
                    }
                    editor.addToArray(callExpression.args, 0, createInvalidLiteral());
                    editor.addToArray(callExpression.args, 0, createInvalidLiteral());
                    editor.addToArray(callExpression.args, 0, createStringLiteral(functionName));
                    editor.addToArray(callExpression.args, 0, brighterscript.createVariableExpression(functionName));
                    this.testSuite.session.globalStubbedMethods.add(functionName);
                } else {
                    let functionName = arg0.callee.name.text;
                    let fullPath = getStringPathFromDottedGet(arg0.callee.obj as DottedGetExpression);
                    editor.removeFromArray(callExpression.args, 0);
                    if (!isNotCalled && !isStubCall) {
                        const expectedArgs = new ArrayLiteralExpression(arg0.args, createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                        editor.addToArray(callExpression.args, 0, expectedArgs);
                    }
                    editor.addToArray(callExpression.args, 0, fullPath ?? createInvalidLiteral());
                    editor.addToArray(callExpression.args, 0, getRootObjectFromDottedGet(arg0.callee));
                    editor.addToArray(callExpression.args, 0, createStringLiteral(functionName));
                    editor.addToArray(callExpression.args, 0, arg0.callee.obj);
                }
            }
        } else if (brighterscript.isDottedGetExpression(arg0)) {
            let functionName = arg0.name.text;
            let fullPath = getStringPathFromDottedGet(arg0.obj as DottedGetExpression);
            arg0 = callExpression.args[0] as DottedGetExpression;
            editor.removeFromArray(callExpression.args, 0);
            if (!isNotCalled && !isStubCall) {
                editor.addToArray(callExpression.args, 0, createInvalidLiteral());
            }
            editor.addToArray(callExpression.args, 0, fullPath ?? createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, getRootObjectFromDottedGet(arg0 as DottedGetExpression));
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
            let fullPath = getStringPathFromDottedGet(arg0.callee as DottedGetExpression);
            editor.addToArray(callExpression.args, 0, fullPath ?? createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, getRootObjectFromDottedGet(arg0.callee as DottedGetExpression));
            editor.addToArray(callExpression.args, 0, createStringLiteral('callFunc'));
            editor.addToArray(callExpression.args, 0, arg0.callee);
        } else if (brighterscript.isCallExpression(arg0) && brighterscript.isVariableExpression(arg0.callee)) {
            let functionName = arg0.callee.getName(brighterscript.ParseMode.BrightScript);
            editor.removeFromArray(callExpression.args, 0);
            if (!isNotCalled && !isStubCall) {
                const expectedArgs = new ArrayLiteralExpression(arg0.args, createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                editor.addToArray(callExpression.args, 0, expectedArgs);
            }
            editor.addToArray(callExpression.args, 0, createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, createStringLiteral(functionName));
            editor.addToArray(callExpression.args, 0, brighterscript.createVariableExpression(functionName));
            this.testSuite.session.globalStubbedMethods.add(functionName);
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
