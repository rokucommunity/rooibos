import type { AstEditor, CallExpression, DottedGetExpression, Expression, FunctionExpression, NamespaceContainer, Scope } from 'brighterscript';
import { ArrayLiteralExpression, createInvalidLiteral, createStringLiteral, createToken, isDottedGetExpression, TokenKind, isFunctionExpression, Parser, ParseMode, util, createVisitor, isCallExpression, WalkMode, createVariableExpression, isCallfuncExpression, isVariableExpression } from 'brighterscript';
import { diagnosticErrorProcessingFile } from '../utils/Diagnostics';
import type { RooibosAnnotation } from './Annotation';
import type { TestCase } from './TestCase';
import { TestBlock } from './TestSuite';
import type { TestSuite } from './TestSuite';
import { getAllDottedGetParts, getRootObjectFromDottedGet, getStringPathFromDottedGet, sanitizeBsJsonString } from './Utils';

export class TestGroup extends TestBlock {

    constructor(testSuite: TestSuite, annotation: RooibosAnnotation) {
        super(annotation);
        this.testSuite = testSuite;
        this.setupFunctionName ??= this.testSuite.setupFunctionName;
        this.tearDownFunctionName ??= this.testSuite.tearDownFunctionName;
        this.beforeEachFunctionName ??= this.testSuite.beforeEachFunctionName;
        this.afterEachFunctionName ??= this.testSuite.afterEachFunctionName;
    }

    public testSuite: TestSuite;
    public testCases: Array<TestCase> = [];

    public addTestCase(testCase: TestCase) {
        this.testCases.push(testCase);
        this.hasIgnoredTests ||= testCase.isIgnored;
        this.hasSoloTests ||= testCase.isSolo;
        this.hasAsyncTests ||= testCase.isAsync;
    }

    public modifyAssertions(testCase: TestCase, noEarlyExit: boolean, editor: AstEditor, namespaceLookup: Map<string, NamespaceContainer>, scope: Scope) {
        //for each method
        //if assertion
        //wrap with if is not fail
        //add line number as last param
        try {
            let func = this.testSuite.classStatement.methods.find((m) => m.name.text.toLowerCase() === testCase.funcName.toLowerCase());
            func.walk(createVisitor({
                ExpressionStatement: (expressionStatement, parent, owner, key) => {
                    let callExpression = expressionStatement.expression as CallExpression;
                    if (isCallExpression(callExpression) && isDottedGetExpression(callExpression.callee)) {
                        let dge = callExpression.callee;
                        let isSub = callExpression.findAncestor<FunctionExpression>(isFunctionExpression)?.functionType.kind === TokenKind.Sub;
                        let assertRegex = /(?:fail|assert(?:[a-z0-9]*)|expect(?:[a-z0-9]*)|stubCall)/i;
                        if (dge && assertRegex.test(dge.name.text)) {
                            // get the path to the call expression
                            // `m`.assert*(...)
                            // `m.testSuite`.assert*(...)
                            // `someMagicVar`.assert*(...)
                            const callPath = util.getAllDottedGetParts(callExpression.callee.obj)?.map((part) => part.text).join('.');

                            if (callPath) {
                                if (dge.name.text === 'stubCall') {
                                    this.modifyModernRooibosExpectCallExpression(callExpression, editor, namespaceLookup, scope);
                                    return expressionStatement;

                                } else {

                                    if (dge.name.text === 'expectCalled' || dge.name.text === 'expectNotCalled') {
                                        this.modifyModernRooibosExpectCallExpression(callExpression, editor, namespaceLookup, scope);
                                    }
                                    if (dge.name.text === 'expectCalled' || dge.name.text === 'expectNotCalled') {
                                        this.modifyModernRooibosExpectCallExpression(callExpression, editor, namespaceLookup, scope);
                                    }

                                    if (!noEarlyExit) {
                                        const trailingLine = Parser.parse(`if ${callPath}.currentResult?.isFail = true then ${callPath}.done() : return ${isSub ? '' : 'invalid'}`).ast.statements[0];
                                        editor.arraySplice(owner, key + 1, 0, trailingLine);
                                    }
                                    const leadingLine = Parser.parse(`${callPath}.currentAssertLineNumber = ${callExpression.range.start.line + 1}`).ast.statements[0];
                                    editor.arraySplice(owner, key, 0, leadingLine);
                                }
                            }
                        }
                    }
                }
            }), {
                walkMode: WalkMode.visitStatementsRecursive
            });
        } catch (e) {
            console.error(e);
            diagnosticErrorProcessingFile(this.testSuite.file, e.message);
        }
    }

    private modifyModernRooibosExpectCallExpression(callExpression: CallExpression, editor: AstEditor, namespaceLookup: Map<string, NamespaceContainer>, scope: Scope) {
        let isNotCalled = false;
        let isStubCall = false;

        //modify args
        let arg0 = callExpression.args[0];
        if (isDottedGetExpression(callExpression.callee)) {
            const nameText = callExpression.callee.name.text;
            isNotCalled = nameText === 'expectNotCalled';
            isStubCall = nameText === 'stubCall';

            if (isStubCall && this.shouldNotModifyStubCall(arg0, namespaceLookup, scope)) {
                return;
            }
            editor.setProperty(callExpression.callee.name, 'text', `_${nameText}`);
        }

        if (isCallExpression(arg0) && isDottedGetExpression(arg0.callee)) {

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
                    editor.addToArray(callExpression.args, 0, createVariableExpression(functionName));
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
        } else if (isDottedGetExpression(arg0)) {
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
        } else if (isCallfuncExpression(arg0)) {
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
        } else if (isCallExpression(arg0) && isVariableExpression(arg0.callee)) {
            let functionName = arg0.callee.getName(ParseMode.BrightScript);
            editor.removeFromArray(callExpression.args, 0);
            if (!isNotCalled && !isStubCall) {
                const expectedArgs = new ArrayLiteralExpression(arg0.args, createToken(TokenKind.LeftSquareBracket), createToken(TokenKind.RightSquareBracket));
                editor.addToArray(callExpression.args, 0, expectedArgs);
            }
            editor.addToArray(callExpression.args, 0, createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, createInvalidLiteral());
            editor.addToArray(callExpression.args, 0, createStringLiteral(functionName));
            editor.addToArray(callExpression.args, 0, createVariableExpression(functionName));
            this.testSuite.session.globalStubbedMethods.add(functionName);
        }
    }

    private shouldNotModifyStubCall(arg0: Expression, namespaceLookup: Map<string, NamespaceContainer>, scope: Scope) {
        if (isDottedGetExpression(arg0)) {
            let nameParts = getAllDottedGetParts(arg0);
            let functionName = nameParts.join('.');
            return scope.getCallableByName(functionName);
        } else if (isVariableExpression(arg0)) {
            return (
                scope.symbolTable.hasSymbol(arg0.getName(ParseMode.BrightScript)) ||
                scope.getCallableByName(arg0.getName(ParseMode.BrighterScript))
            );
        }
        return false;
    }

    public asText(): string {
        let testCaseText = [...this.testCases].filter((tc) => tc.isIncluded).map((tc) => tc.asText());

        return `
            {
                name: ${sanitizeBsJsonString(this.name)}
                isSolo: ${this.isSolo}
                isIgnored: ${this.isIgnored}
                isAsync: ${this.isAsync}
                filename: "${this.pkgPath}"
                lineNumber: "${this.annotation.annotation.range.start.line + 1}"
                setupFunctionName: "${this.setupFunctionName || ''}"
                tearDownFunctionName: "${this.tearDownFunctionName || ''}"
                beforeEachFunctionName: "${this.beforeEachFunctionName || ''}"
                afterEachFunctionName: "${this.afterEachFunctionName || ''}"
                testCases: [${testCaseText.join(',\n')}]
            }`;
    }
}
