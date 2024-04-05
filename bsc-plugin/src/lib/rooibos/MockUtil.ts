/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { BrsFile, Editor, ProgramBuilder } from 'brighterscript';
import {
    Position, isClassStatement, isVariableExpression,
    isFunctionStatement, FunctionStatement, ParseMode,
    FunctionExpression, FunctionParameterExpression, createVisitor,
    isCallExpression, isDottedGetExpression, CallExpression, WalkMode
} from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeStatement } from './RawCodeStatement';
import { Range } from 'vscode-languageserver-types';
import type { FileFactory } from './FileFactory';
import undent from 'undent';
import type { RooibosSession } from './RooibosSession';
import { diagnosticErrorProcessingFile } from '../utils/Diagnostics';
import type { TestCase } from './TestCase';
import type { TestSuite } from './TestSuite';
import { getAllDottedGetParts } from './Utils';

export class MockUtil {

    constructor(builder: ProgramBuilder, fileFactory: FileFactory, session: RooibosSession) {
        this.config = (builder.options as any).rooibos as RooibosConfig || {};
        this.filePathMap = {};
        this.fileId = 0;
        this.session = session;
        this.fileFactory = fileFactory;
    }
    session: RooibosSession;

    private brsFileAdditions = `
    function RBS_SM_#ID#_getMocksByFunctionName()
        if m._rMocksByFunctionName = invalid
        m._rMocksByFunctionName = {}
        end if
        return m._rMocksByFunctionName
    end function
`;

    private config: RooibosConfig;
    private fileId: number;
    private filePathMap: any;
    private fileFactory: FileFactory;
    private processedStatements: Set<FunctionStatement>;
    private editor: Editor;

    enableGlobalMethodMocks(file: BrsFile, editor: Editor) {
        if (this.config.isGlobalMethodMockingEnabled) {
            this._processFile(file, editor);
        }
    }

    _processFile(file: BrsFile, editor: Editor) {
        this.fileId++;
        this.processedStatements = new Set<FunctionStatement>();
        this.editor = editor;
        // console.log('processing global methods on ', file.pkgPath);
        for (let fs of file[ '_cachedLookups' ].functionStatements) {
            this.enableMockOnFunction(fs);
        }

        this.filePathMap[ this.fileId ] = file.pkgPath;
        if (this.processedStatements.size > 0) {
            this.addBrsAPIText(file);
        }
    }

    private enableMockOnFunction(functionStatement: FunctionStatement) {
        if (isClassStatement(functionStatement.parent?.parent)) {
            // console.log('skipping class', functionStatement.parent?.parent?.name?.text);
            return;
        }
        if (this.processedStatements.has(functionStatement)) {
            // console.log('skipping processed expression');
            return;
        }

        const methodName = functionStatement?.getName(ParseMode.BrightScript).toLowerCase() || '';
        // console.log('MN', methodName);
        if (this.config.isGlobalMethodMockingEfficientMode && !this.session.globalStubbedMethods.has(methodName)) {
            // console.log('skipping method that is not stubbed', methodName);
            return;
        }

        // console.log('processing  stubbed method', methodName);
        // TODO check if the user has actually mocked or stubbed this function, otherwise leave it alone!
        let functionExpression = new FunctionExpression({
            parameters: functionStatement.func.parameters.map(parameter => {
                return new FunctionParameterExpression({
                    name: parameter.tokens.name,
                    equals: parameter.tokens.equals,
                    defaultValue: parameter.defaultValue,
                    as: null,
                });
            }),
            body: functionStatement.func.body,
            functionType: functionStatement.func.tokens.functionType,
            endFunctionType: functionStatement.func.tokens.endFunctionType,
            leftParen: functionStatement.func.tokens.leftParen,
            rightParen: functionStatement.func.tokens.rightParen,
            as: functionStatement.func.tokens.as,
            returnTypeExpression: functionStatement.func.returnTypeExpression,
        });
        functionStatement = new FunctionStatement({
            name: functionStatement.tokens.name,
            func: functionExpression
        })
        functionStatement.func = functionExpression;
        const paramNames = functionStatement.func.parameters.map((param) => param.tokens.name.text).join(',');

        // const returnStatement = ((functionStatement.func.functionType?.kind === brighterscript.TokenKind.Sub && (functionStatement.func.returnTypeToken === undefined || functionStatement.func.returnTypeToken?.kind === brighterscript.TokenKind.Void)) || functionStatement.func.returnTypeToken?.kind === brighterscript.TokenKind.Void) ? 'return' : 'return result';
        let returnStatement = 'return';
        if (isVariableExpression(functionStatement?.func?.returnTypeExpression?.expression)) {
            if (functionStatement.func.returnTypeExpression.expression.getName() !== 'void') {
                returnStatement = 'return result';
            }
        }
        this.editor.addToArray(functionStatement.func.body.statements, 0, new RawCodeStatement(undent`
            if RBS_SM_${this.fileId}_getMocksByFunctionName()["${methodName}"] <> invalid
                result = RBS_SM_${this.fileId}_getMocksByFunctionName()["${methodName}"].callback(${paramNames})
                ${returnStatement}
            end if
            `));

        this.processedStatements.add(functionStatement);
    }

    addBrsAPIText(file: BrsFile) {
        //TODO should use ast editor!
        const func = new RawCodeStatement(this.brsFileAdditions.replace(/\#ID\#/g, this.fileId.toString().trim()), file, Range.create(Position.create(1, 1), Position.create(1, 1)));
        file.ast.statements.push(func);
    }


    gatherGlobalMethodMocks(testSuite: TestSuite) {
        // console.log('gathering global method mocks for testSuite', testSuite.name);
        for (let group of [ ...testSuite.testGroups.values() ].filter((tg) => tg.isIncluded)) {
            for (let testCase of [ ...group.testCases.values() ].filter((tc) => tc.isIncluded)) {
                this.gatherMockedGlobalMethods(testSuite, testCase);
            }
        }

    }
    private gatherMockedGlobalMethods(testSuite: TestSuite, testCase: TestCase) {
        try {
            let func = testSuite.classStatement.methods.find((m) => m.tokens.name.text.toLowerCase() === testCase.funcName.toLowerCase());
            func.walk(createVisitor({
                ExpressionStatement: (expressionStatement, parent, owner) => {
                    let callExpression = expressionStatement.expression as CallExpression;
                    if (isCallExpression(callExpression) && isDottedGetExpression(callExpression.callee)) {
                        let dge = callExpression.callee;
                        let assertRegex = /(?:fail|assert(?:[a-z0-9]*)|expect(?:[a-z0-9]*)|stubCall)/i;
                        if (dge && assertRegex.test(dge.tokens.name.text)) {
                            if (dge.tokens.name.text === 'stubCall') {
                                this.processGlobalStubbedMethod(callExpression);
                                return expressionStatement;

                            } else {

                                if (dge.tokens.name.text === 'expectCalled' || dge.tokens.name.text === 'expectNotCalled') {
                                    this.processGlobalStubbedMethod(callExpression);
                                }
                            }
                        }
                    }
                }
            }), {
                walkMode: WalkMode.visitStatementsRecursive
            });
        } catch (e) {
            console.log(e);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            diagnosticErrorProcessingFile(testSuite.file, e.message);
        }
    }

    private processGlobalStubbedMethod(callExpression: CallExpression) {
        let isNotCalled = false;
        let isStubCall = false;
        const namespaceLookup = this.session.namespaceLookup;
        if (isDottedGetExpression(callExpression.callee)) {
            const nameText = callExpression.callee.tokens.name.text;
            isNotCalled = nameText === 'expectNotCalled';
            isStubCall = nameText === 'stubCall';
        }
        //modify args
        let arg0 = callExpression.args[ 0 ];
        if (isCallExpression(arg0) && isDottedGetExpression(arg0.callee)) {

            //is it a namespace?
            let dg = arg0.callee;
            let nameParts = getAllDottedGetParts(dg);
            let name = nameParts.pop();

            // console.log('found expect with name', name);
            if (name) {
                //is a namespace?
                if (nameParts[ 0 ] && namespaceLookup.has(nameParts[ 0 ].toLowerCase())) {
                    //then this must be a namespace method
                    let fullPathName = nameParts.join('.').toLowerCase();
                    let ns = namespaceLookup.get(fullPathName);
                    if (!ns) {
                        //TODO this is an error condition!
                    }
                    nameParts.push(name);
                    let functionName = nameParts.join('_').toLowerCase();
                    this.session.globalStubbedMethods.add(functionName);
                }
            }
        } else if (isCallExpression(arg0) && isVariableExpression(arg0.callee)) {
            let functionName = arg0.callee.getName(ParseMode.BrightScript).toLowerCase();
            this.session.globalStubbedMethods.add(functionName);
        }
    }

}

