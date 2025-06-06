import type { BrsFile, CallExpression, Editor, Expression, FunctionStatement, NamespaceStatement, ProgramBuilder, Scope } from 'brighterscript';
import { ParseMode, Parser, WalkMode, createVisitor, isCallExpression, isClassStatement, isDottedGetExpression, isNamespaceStatement, isVariableExpression } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import undent from 'undent';
import type { RooibosSession } from './RooibosSession';
import { diagnosticErrorProcessingFile } from '../utils/Diagnostics';
import type { TestCase } from './TestCase';
import type { TestSuite } from './TestSuite';
import { functionRequiresReturnValue, getAllDottedGetParts, getScopeForSuite } from './Utils';

export class MockUtil {

    constructor(builder: ProgramBuilder, session: RooibosSession) {
        this.config = (builder.options as any).rooibos as RooibosConfig || {};
        this.filePathMap = {};
        this.fileId = 0;
        this.session = session;
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
    private processedStatements: Set<FunctionStatement>;
    private astEditor: Editor;

    enableGlobalMethodMocks(file: BrsFile, astEditor: Editor) {
        if (this.config.isGlobalMethodMockingEnabled) {
            this._processFile(file, astEditor);
        }
    }

    _processFile(file: BrsFile, astEditor: Editor) {
        this.fileId++;
        this.processedStatements = new Set<FunctionStatement>();
        this.astEditor = astEditor;
        // console.log('processing global methods on ', file.pkgPath);
        for (let functionStatement of file.parser.references.functionStatements) {
            this.enableMockOnFunction(file, functionStatement);
        }

        this.filePathMap[this.fileId] = file.pkgPath;
        if (this.processedStatements.size > 0) {
            this.addBrsAPIText(file);
        }
    }

    private enableMockOnFunction(file: BrsFile, functionStatement: FunctionStatement) {
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

        let isDisabledFoMocking = functionStatement.annotations?.find(x => x.name.toLowerCase() === 'disablemocking');
        let parentNamespace = functionStatement.findAncestor<NamespaceStatement>(isNamespaceStatement);
        while (parentNamespace && !isDisabledFoMocking) {
            if (parentNamespace) {
                isDisabledFoMocking = parentNamespace.annotations?.find(x => x.name.toLowerCase() === 'disablemocking');
                parentNamespace = parentNamespace.findAncestor<NamespaceStatement>(isNamespaceStatement);
            }
        }
        if (isDisabledFoMocking) {
            // The developer has stated that this function is not safe to be mocked
            return;
        }

        // console.log('processing  stubbed method', methodName);
        // TODO check if the user has actually mocked or stubbed this function, otherwise leave it alone!

        for (let param of functionStatement.func.parameters) {
            param.asToken = null;
        }

        const paramNames = functionStatement.func.parameters.map((param) => param.name.text).join(',');
        const requiresReturnValue = functionRequiresReturnValue(functionStatement);
        const globalAaName = '__stubs_globalAa';
        const resultName = '__stubOrMockResult';
        const storageName = '__globalStubs';

        const template = undent`
            ${globalAaName} = getGlobalAa()
            if RBS_SM_${this.fileId}_getMocksByFunctionName()["${methodName}"] <> invalid
                ${resultName} = RBS_SM_${this.fileId}_getMocksByFunctionName()["${methodName}"].callback(${paramNames})
                return${requiresReturnValue ? ` ${resultName}` : ''}
            else if type(${globalAaName}?.${storageName}?.${methodName}).endsWith("Function")
                __stubFunction = ${globalAaName}.${storageName}.${methodName}
                ${resultName} = __stubFunction(${paramNames})
                return${requiresReturnValue ? ` ${resultName}` : ''}
            else if ${globalAaName}?.${storageName} <> invalid and ${globalAaName}.${storageName}.doesExist("${methodName}")
                value = ${globalAaName}.${storageName}.${methodName}
                return${requiresReturnValue ? ` value` : ''}
            end if
        `;
        const astCodeToInject = Parser.parse(template).ast.statements;
        this.astEditor.arrayUnshift(functionStatement.func.body.statements, ...astCodeToInject);

        this.processedStatements.add(functionStatement);
        file.needsTranspiled = true;
    }

    addBrsAPIText(file: BrsFile) {
        const func = Parser.parse(this.brsFileAdditions.replace(/\#ID\#/g, this.fileId.toString().trim())).ast.statements;
        this.astEditor.arrayPush(file.ast.statements, ...func);
    }


    gatherGlobalMethodMocks(testSuite: TestSuite) {
        // console.log('gathering global method mocks for testSuite', testSuite.name);
        for (let group of [...testSuite.testGroups.values()].filter((tg) => tg.isIncluded)) {
            for (let testCase of [...group.testCases].filter((tc) => tc.isIncluded)) {
                this.gatherMockedGlobalMethods(testSuite, testCase);
            }
        }

    }
    private gatherMockedGlobalMethods(testSuite: TestSuite, testCase: TestCase) {
        try {
            let func = testSuite.classStatement.methods.find((m) => m.name.text.toLowerCase() === testCase.funcName.toLowerCase());
            func.walk(createVisitor({
                ExpressionStatement: (expressionStatement, parent, owner) => {
                    let callExpression = expressionStatement.expression as CallExpression;
                    if (isCallExpression(callExpression) && isDottedGetExpression(callExpression.callee)) {
                        let dge = callExpression.callee;
                        let assertRegex = /(?:fail|assert(?:[a-z0-9]*)|expect(?:[a-z0-9]*)|stubCall)/i;
                        if (dge && assertRegex.test(dge.name.text)) {
                            if (dge.name.text === 'stubCall') {
                                this.processGlobalStubbedMethod(callExpression, testSuite);
                                return expressionStatement;

                            } else {

                                if (dge.name.text === 'expectCalled' || dge.name.text === 'expectNotCalled') {
                                    this.processGlobalStubbedMethod(callExpression, testSuite);
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
            diagnosticErrorProcessingFile(testSuite.file, e.message);
        }
    }

    private processGlobalStubbedMethod(callExpression: CallExpression, testSuite: TestSuite) {
        let isStubCall = false;
        const scope = getScopeForSuite(testSuite);
        if (isDottedGetExpression(callExpression.callee)) {
            const nameText = callExpression.callee.name.text;
            isStubCall = nameText === 'stubCall';
        }
        //modify args
        let arg0 = callExpression.args[0];

        if (isStubCall) {
            let functionName = this.getGlobalFunctionName(arg0, scope);
            if (functionName) {
                this.session.globalStubbedMethods.add(functionName.toLowerCase());
                return;
            }
        }

        if (isCallExpression(arg0)) {
            let functionName = this.getGlobalFunctionName(arg0.callee, scope);
            if (functionName) {
                this.session.globalStubbedMethods.add(functionName.toLowerCase());
            }
        }
    }


    private getGlobalFunctionName(expression: Expression, scope: Scope) {
        let result: string;
        if (isDottedGetExpression(expression)) {
            let nameParts = getAllDottedGetParts(expression);
            let functionName = nameParts.join('.');
            let callable = scope.getCallableByName(functionName);
            if (callable) {
                result = callable.getName(ParseMode.BrightScript);
            }
        } else if (isVariableExpression(expression)) {
            let functionName = expression.getName(ParseMode.BrightScript);
            if (scope.symbolTable.hasSymbol(functionName)) {
                result = functionName;
            }

            functionName = expression.getName(ParseMode.BrighterScript);
            if (scope.getCallableByName(functionName)) {
                result = functionName;
            }
        }

        return result;
    }
}
