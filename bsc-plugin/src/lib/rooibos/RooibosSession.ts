import * as path from 'path';
import type { BrsFile, ClassStatement, FunctionStatement, NamespaceStatement, Program, ProgramBuilder } from 'brighterscript';
import { util } from 'brighterscript';
import { isBrsFile, ParseMode } from 'brighterscript';
import type { AstEditor } from 'brighterscript/dist/astUtils/AstEditor';
import type { RooibosConfig } from './RooibosConfig';
import { SessionInfo } from './RooibosSessionInfo';
import { TestSuiteBuilder } from './TestSuiteBuilder';
import { RawCodeStatement } from './RawCodeStatement';
import type { FileFactory } from './FileFactory';
import type { TestSuite } from './TestSuite';
import { diagnosticErrorNoMainFound as diagnosticWarnNoMainFound } from '../utils/Diagnostics';
import undent from 'undent';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
import * as fsExtra from 'fs-extra';

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
    public config: RooibosConfig;
    private _suiteBuilder: TestSuiteBuilder;

    public sessionInfo: SessionInfo;

    public reset() {
        this.sessionInfo = new SessionInfo(this.config);
    }

    public updateSessionStats() {
        this.sessionInfo.updateInfo();
    }

    public processFile(file: BrsFile): boolean {
        let testSuites = this._suiteBuilder.processFile(file);
        return testSuites.length > 0;
    }

    public addLaunchHookToExistingMain(editor: AstEditor) {
        let mainFunction: FunctionStatement;
        const files = this._builder.program.getScopeByName('source').getOwnFiles();
        for (let file of files) {
            if (isBrsFile(file)) {
                const mainFunc = file.parser.references.functionStatements.find((f) => f.name.text.toLowerCase() === 'main');
                if (mainFunc) {
                    mainFunction = mainFunc;
                    break;
                }
            }
        }
        if (mainFunction) {
            editor.addToArray(mainFunction.func.body.statements, 0, new RawCodeStatement(`Rooibos_init()`));
        }
    }
    public addLaunchHookFileIfNotPresent() {
        let mainFunction: FunctionStatement;
        const files = this._builder.program.getScopeByName('source').getOwnFiles();
        for (let file of files) {
            if (isBrsFile(file)) {
                const mainFunc = file.parser.references.functionStatements.find((f) => f.name.text.toLowerCase() === 'main');
                if (mainFunc) {
                    mainFunction = mainFunc;
                    break;
                }
            }
        }
        if (!mainFunction) {
            diagnosticWarnNoMainFound(files[0]);
            const filePath = path.join(this._builder.options.stagingDir, 'source/rooibosMain.brs');
            fsExtra.writeFileSync(filePath, `function main()\n    Rooibos_init()\nend function`);
        }
    }

    public addTestRunnerMetadata(editor: AstEditor) {
        let runtimeConfig = this._builder.program.getFile<BrsFile>('source/rooibos/RuntimeConfig.bs');
        if (runtimeConfig) {
            let classStatement = (runtimeConfig.ast.statements[0] as NamespaceStatement).body.statements[0] as ClassStatement;
            this.updateRunTimeConfigFunction(classStatement, editor);
            this.updateVersionTextFunction(classStatement, editor);
            this.updateClassLookupFunction(classStatement, editor);
            this.updateGetAllTestSuitesNames(classStatement, editor);
            this.createIgnoredTestsInfoFunction(classStatement, editor);
        }
    }

    public updateRunTimeConfigFunction(classStatement: ClassStatement, editor: AstEditor) {
        let method = classStatement.methods.find((m) => m.name.text === 'getRuntimeConfig');
        if (method) {
            editor.addToArray(
                method.func.body.statements,
                method.func.body.statements.length,
                new RawCodeStatement(undent`
                    return {
                        "failFast": ${this.config.failFast ? 'true' : 'false'}
                        "sendHomeOnFinish": ${this.config.sendHomeOnFinish ? 'true' : 'false'}
                        "logLevel": ${this.config.logLevel ?? 0}
                        "showOnlyFailures": ${this.config.showOnlyFailures ? 'true' : 'false'}
                        "printTestTimes": ${this.config.printTestTimes ? 'true' : 'false'}
                        "lineWidth": ${this.config.lineWidth || 60}
                        "printLcov": ${this.config.printLcov ? 'true' : 'false'}
                        "port": "${this.config.port || 'invalid'}"
                        "catchCrashes": ${this.config.catchCrashes ? 'true' : 'false'}
                    }`
                )
            );
        }
    }

    public updateVersionTextFunction(classStatement: ClassStatement, editor: AstEditor) {
        let method = classStatement.methods.find((m) => m.name.text === 'getVersionText');
        if (method) {
            editor.addToArray(
                method.func.body.statements,
                method.func.body.statements.length,
                new RawCodeStatement(`return "${pkg.version}"`)
            );
        }
    }

    public updateClassLookupFunction(classStatement: ClassStatement, editor: AstEditor) {
        let method = classStatement.methods.find((m) => m.name.text === 'getTestSuiteClassWithName');
        if (method) {
            editor.arrayPush(method.func.body.statements, new RawCodeStatement(undent`
                if false
                    ? "noop" ${this.sessionInfo.testSuitesToRun.map(suite => `
                else if name = "${suite.name}"
                    return ${suite.classStatement.getName(ParseMode.BrightScript)}`).join('')}
                end if
            `));
        }
    }

    public updateGetAllTestSuitesNames(classStatement: ClassStatement, editor: AstEditor) {
        let method = classStatement.methods.find((m) => m.name.text === 'getAllTestSuitesNames');
        if (method) {
            editor.arrayPush(method.func.body.statements, new RawCodeStatement([
                'return [',
                ...this.sessionInfo.testSuitesToRun.map((s) => `    "${s.name}"`),
                ']'
            ].join('\n')));
        }
    }

    public createNodeFiles(program: Program) {

        for (let suite of this.sessionInfo.testSuitesToRun.filter((s) => s.isNodeTest)) {
            this.createNodeFile(program, suite);
        }
    }

    createNodeFile(program: Program, suite: TestSuite) {
        let p = path.join('components', 'rooibos', 'generated');

        let xmlText = this.getNodeTestXmlText(suite);
        let bsPath = path.join(p, `${suite.generatedNodeName}.bs`);
        this.fileFactory.addFile(program, path.join(p, `${suite.generatedNodeName}.xml`), xmlText);
        let bsFile = program.getFile(bsPath);
        if (bsFile) {
            (bsFile as BrsFile).parser.statements.push();
            bsFile.needsTranspiled = true;
        }
        let brsFile = this.fileFactory.addFile(program, bsPath, undent`
        import "pkg:/${suite.file.pkgPath}"
        function init()
        nodeRunner = Rooibos_TestRunner(m.top.getScene(), m)
        m.top.rooibosTestResult = nodeRunner.runInNodeMode("${suite.name}")
            end function
        `);
        brsFile.parser.invalidateReferences();
    }

    private getNodeTestXmlText(suite: TestSuite) {
        return this.fileFactory.createTestXML(suite.generatedNodeName, suite.nodeName);
    }

    public createIgnoredTestsInfoFunction(cs: ClassStatement, editor: AstEditor) {
        let method = cs.methods.find((m) => m.name.text === 'getIgnoredTestInfo');
        if (method) {
            editor.arrayPush(method.func.body.statements, new RawCodeStatement([
                'return {',
                `    "count": ${this.sessionInfo.ignoredCount}`,
                `    "items": [`,
                ...this.sessionInfo.ignoredTestNames.map((name) => `        "${name}"`),
                `    ]`,
                `}`
            ].join('\n')));
        }
    }
}
