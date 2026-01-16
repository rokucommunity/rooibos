import * as path from 'path';
import type { BrsFile, BscFile, ClassStatement, Editor, FunctionStatement, NamespaceContainer, NamespaceStatement, Program, ProgramBuilder, Scope } from 'brighterscript';
import { isBrsFile, isCallExpression, isClassStatement, isDottedGetExpression, isVariableExpression, ParseMode, Parser, WalkMode } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { SessionInfo } from './RooibosSessionInfo';
import { TestSuiteBuilder } from './TestSuiteBuilder';
import type { FileFactory } from './FileFactory';
import type { TestSuite } from './TestSuite';
import { diagnosticErrorNoMainFound as diagnosticWarnNoMainFound, diagnosticNoOutDir, RooibosLogPrefix } from '../utils/Diagnostics';
import undent from 'undent';
import * as fsExtra from 'fs-extra';
import type { MockUtil } from './MockUtil';
import { getMainFunctionStatement } from './Utils';

// eslint-disable-next-line
const pkg = require('../../../package.json');

export class RooibosSession {

    constructor(builder: ProgramBuilder, fileFactory: FileFactory) {
        this.fileFactory = fileFactory;
        this.config = builder.options ? (builder.options as any).rooibos as RooibosConfig || {} : {};
        this._builder = builder;
        this._suiteBuilder = new TestSuiteBuilder(this);
        this.reset();
    }

    private fileFactory: FileFactory;
    private _builder: ProgramBuilder;
    config: RooibosConfig;
    namespaceLookup: Map<string, NamespaceContainer>;
    private _suiteBuilder: TestSuiteBuilder;

    sessionInfo: SessionInfo;
    globalStubbedMethods = new Set<string>();

    reset() {
        this.sessionInfo = new SessionInfo(this.config);
    }

    prepareForTranspile(editor: Editor, program: Program, mockUtil: MockUtil) {
        this.addTestRunnerMetadata(editor);
        this.addLaunchHookToExistingMain(editor);

        // Make sure to create the node files before running the global mock logic
        // We realy on them in order to check the component scope for the global functions
        const resultFiles = this.createNodeFiles(program);

        if (this.config.isGlobalMethodMockingEnabled && this.config.isGlobalMethodMockingEfficientMode) {
            program.logger.info(RooibosLogPrefix, 'Efficient global stubbing is enabled');
            this.namespaceLookup = this.getNamespaces(program);
            for (let testSuite of this.sessionInfo.testSuitesToRun) {
                mockUtil.gatherGlobalMethodMocks(testSuite);
            }

        } else {
            this.namespaceLookup = new Map<string, NamespaceContainer>();
        }
        return resultFiles;
    }

    updateSessionStats() {
        this.sessionInfo.updateInfo();
    }

    processFile(file: BrsFile): TestSuite[] {
        let testSuites = this._suiteBuilder.processFile(file);
        return testSuites;
    }

    addLaunchHookToExistingMain(editor: Editor) {
        let mainFunction: FunctionStatement;
        const files = this._builder.program.getScopeByName('source').getOwnFiles();
        for (let file of files) {
            if (isBrsFile(file)) {
                const mainFunc = getMainFunctionStatement(file);
                if (mainFunc) {
                    mainFunction = mainFunc;
                    break;
                }
            }
        }
        if (mainFunction) {
            const initCall = mainFunction.func.body.findChild(f => {
                if (isCallExpression(f)) {
                    const callee = f.callee;
                    if (isVariableExpression(callee)) {
                        if (callee.tokens.name.text.toLowerCase() === 'rooibos_init') {
                            return true;
                        }
                    } else if (isDottedGetExpression(callee)) {
                        if (isVariableExpression(callee.obj)) {
                            if (callee.obj.tokens.name.text.toLowerCase() === 'rooibos') {
                                if (callee.tokens.name.text.toLowerCase() === 'init') {
                                    return true;
                                }
                            }
                        }
                    }
                }
            }, {
                walkMode: WalkMode.visitAllRecursive
            });
            if (!initCall) {
                editor.addToArray(mainFunction.func.body.statements, 0, Parser.parse(`Rooibos_init("${this.config?.testSceneName ?? 'RooibosScene'}")`).ast.statements[0]);
            }
        }
    }
    addLaunchHookFileIfNotPresent() {
        let mainFunction: FunctionStatement;
        const files = this._builder.program.getScopeByName('source').getOwnFiles();
        for (let file of files) {
            if (isBrsFile(file)) {
                const mainFunc = getMainFunctionStatement(file);
                if (mainFunc) {
                    mainFunction = mainFunc;
                    break;
                }
            }
        }
        if (!mainFunction) {
            diagnosticWarnNoMainFound(files[0] as BrsFile);
            if (!this._builder.options.outDir) {
                this._builder.program.logger.error(RooibosLogPrefix, 'Rooibos requires that outDir bsconfig option is set');
                diagnosticNoOutDir(files[0] as BrsFile);
            } else {
                const filePath = path.join(this._builder.options.outDir, 'source/rooibosMain.brs');
                fsExtra.ensureDirSync(path.dirname(filePath));
                fsExtra.writeFileSync(filePath, `function main()\n    Rooibos_init("${this.config?.testSceneName ?? 'RooibosScene'}")\nend function`);
            }
        }
    }

    addTestRunnerMetadata(editor: Editor) {
        let runtimeConfig = this._builder.program.getFile<BrsFile>('source/rooibos/RuntimeConfig.bs');
        const classStatement = runtimeConfig?.ast?.findChild<ClassStatement>((node) => {
            return isClassStatement(node) && node.tokens?.name?.text?.toLowerCase() === 'runtimeconfig';
        });
        if (classStatement) {
            this.updateRunTimeConfigFunction(classStatement, editor);
            this.updateVersionTextFunction(classStatement, editor);
            this.updateClassMapFunction(classStatement, editor);
            this.createIgnoredTestsInfoFunction(classStatement, editor);
        }
    }

    updateRunTimeConfigFunction(classStatement: ClassStatement, editor: Editor) {
        let method = classStatement.methods.find((m) => m.tokens.name.text === 'getRuntimeConfig');
        if (method) {
            if (method.func.body.statements.length > 0) {
                editor.arrayPop(method.func.body.statements);
            }
            editor.arrayPush(
                method.func.body.statements,
                Parser.parse(undent`
                    return {
                        "reporters": ${this.getReportersList()}
                        "failFast": ${this.config.failFast ? 'true' : 'false'}
                        "sendHomeOnFinish": ${this.config.sendHomeOnFinish ? 'true' : 'false'}
                        "logLevel": ${this.config.logLevel ?? 0}
                        "showOnlyFailures": ${this.config.showOnlyFailures ? 'true' : 'false'}
                        "printTestTimes": ${this.config.printTestTimes ? 'true' : 'false'}
                        "lineWidth": ${this.config.lineWidth || 60}
                        "printLcov": ${this.config.printLcov ? 'true' : 'false'}
                        "port": "${this.config.port || 'invalid'}"
                        "catchCrashes": ${this.config.catchCrashes ? 'true' : 'false'}
                        "colorizeOutput": ${this.config.colorizeOutput ? 'true' : 'false'}
                        "throwOnFailedAssertion": ${this.config.throwOnFailedAssertion ? 'true' : 'false'}
                        "keepAppOpen": ${this.config.keepAppOpen === undefined || this.config.keepAppOpen ? 'true' : 'false'}
                        "isRecordingCodeCoverage": ${this.config.isRecordingCodeCoverage ? 'true' : 'false'}
                    }
                `).ast.statements[0]
            );
        }
    }

    getReportersList() {
        let reporters = this.config.reporters;
        if (!Array.isArray(reporters)) {
            reporters = [];
        }
        if (this.config.reporter) {
            // @todo: warn that `reporter` is deprecated and to use `reporters` instead
            reporters.push(this.config.reporter);
        }
        if (reporters.length < 1) {
            reporters.push('console');
        }
        return `[${reporters.map(this.sanitiseReporterName).toString()}]`;
    }

    sanitiseReporterName(name: string) {
        switch (name.toLowerCase()) {
            case 'console': return 'rooibos_ConsoleTestReporter';
            case 'junit': return 'rooibos_JUnitTestReporter';
            case 'mocha': return 'rooibos_MochaTestReporter';
        }
        // @todo: check if function name is valid
        return name;
    }

    updateVersionTextFunction(classStatement: ClassStatement, editor: Editor) {
        let method = classStatement.methods.find((m) => m.tokens.name.text === 'getVersionText');
        if (method) {
            if (method.func.body.statements.length > 0) {
                editor.arrayPop(method.func.body.statements);
            }
            editor.arrayPush(
                method.func.body.statements,
                Parser.parse(`return "${pkg.version}"`).ast.statements[0]
            );
        }
    }

    updateClassMapFunction(classStatement: ClassStatement, editor: Editor) {
        let method = classStatement.methods.find((m) => m.tokens.name.text === 'getTestSuiteClassMap');
        if (method) {
            if (method.func.body.statements.length > 0) {
                editor.arrayPop(method.func.body.statements);
            }
            editor.arrayPush(method.func.body.statements, ...Parser.parse(undent`
                return {${this.sessionInfo.testSuitesToRun.map(suite => `
                    "${suite.name}": ${suite.classStatement.getName(ParseMode.BrightScript)}`).join('')}
                }
            `).ast.statements);
        }
    }

    createNodeFiles(program: Program) {
        const createdFiles: BscFile[] = [];
        for (let suite of this.sessionInfo.testSuitesToRun.filter((s) => s.isNodeTest)) {
            createdFiles.push(...this.createNodeFile(program, suite));
        }
        return createdFiles;
    }

    createNodeFile(program: Program, suite: TestSuite) {
        let xmlText = this.getNodeTestXmlText(suite);
        let xmlFile = this.fileFactory.addFile(program, suite.xmlPkgPath, xmlText);

        let bsFile = this.fileFactory.addFile(program, suite.bsPkgPath, undent`
            function init()
                m.top.addField("rooibosRunSuite", "boolean", false)
                m.top.observeFieldScoped("rooibosRunSuite", "rooibosRunSuite")
            end function

            function rooibosRunSuite()
                m.top.unobserveFieldScoped("rooibosRunSuite")
                nodeRunner = Rooibos_TestRunner(m.top.getScene(), m)
                m.top.rooibosTestResult = nodeRunner.runInNodeMode("${suite.name}")
            end function
        `);
        return [xmlFile, bsFile];
    }

    public getNodeTestXmlText(suite: TestSuite) {
        return this.fileFactory.createTestXML(suite.generatedNodeName, suite.nodeName, suite);
    }

    private getNamespaceLookup(scope: Scope): Map<string, NamespaceContainer> {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        return scope['cache'].getOrAdd('namespaceLookup', () => scope.buildNamespaceLookup() as any);
    }

    private getNamespaces(program: Program) {
        let scopeNamespaces = new Map<string, NamespaceContainer>();
        let processedScopes = new Set<string>();

        for (const file of Object.values(program.files)) {

            for (let scope of program.getScopesForFile(file)) {
                if (processedScopes.has(scope.dependencyGraphKey)) {
                    // Skip this scope if it has already been processed
                    continue;
                }
                let scopeMap = this.getNamespaceLookup(scope);
                // scopeNamespaces = new Map<string, NamespaceContainer>([...Array.from(scopeMap.entries())]);
                for (let [key, value] of scopeMap.entries()) {
                    scopeNamespaces.set(key, value);
                }
                processedScopes.add(scope.dependencyGraphKey);
            }
        }
        return scopeNamespaces;
    }


    private createIgnoredTestsInfoFunction(cs: ClassStatement, editor: Editor) {
        let method = cs.methods.find((m) => m.tokens.name.text === 'getIgnoredTestInfo');
        if (method) {
            if (method.func.body.statements.length > 0) {
                editor.arrayPop(method.func.body.statements);
            }
            editor.arrayPush(method.func.body.statements, ...Parser.parse([
                'return {',
                `    "count": ${this.sessionInfo.ignoredCount}`,
                `    "items": [`,
                ...this.sessionInfo.ignoredTestNames.map((name) => `"${name}"`),
                `    ]`,
                `}`
            ].join('\n')).ast.statements);
        }
    }

}
