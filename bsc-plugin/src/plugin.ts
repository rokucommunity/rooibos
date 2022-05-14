import type {
    BscFile,
    CompilerPlugin,
    Program,
    ProgramBuilder,
    TranspileObj,
    AstEditor
} from 'brighterscript';
import {
    isBrsFile
} from 'brighterscript';
import { RooibosSession } from './lib/rooibos/RooibosSession';
import { CodeCoverageProcessor } from './lib/rooibos/CodeCoverageProcessor';
import { FileFactory } from './lib/rooibos/FileFactory';
import type { RooibosConfig } from './lib/rooibos/RooibosConfig';
import * as minimatch from 'minimatch';

export class RooibosPlugin implements CompilerPlugin {

    name: 'rooibosPlugin';
    public session: RooibosSession;
    public codeCoverageProcessor: CodeCoverageProcessor;
    public fileFactory: FileFactory;
    public _builder: ProgramBuilder;
    public config: RooibosConfig;

    beforeProgramCreate(builder: ProgramBuilder): void {
        this._builder = builder;

        this.config = this.getConfig((builder.options as any).rooibos || {});

        this.fileFactory = new FileFactory(this.config);
        if (!this.session) {
            this.session = new RooibosSession(builder, this.fileFactory);
            this.codeCoverageProcessor = new CodeCoverageProcessor(builder);
        }
    }
    private getConfig(options: any) {
        let config: RooibosConfig = options;
        if (config.printTestTimes === undefined) {
            config.printTestTimes = true;
        }
        if (config.catchCrashes === undefined) {
            config.catchCrashes = true;
        }
        if (config.sendHomeOnFinish === undefined) {
            config.sendHomeOnFinish = true;
        }
        if (config.failFast === undefined) {
            config.failFast = true;
        }
        if (config.showOnlyFailures === undefined) {
            config.showOnlyFailures = true;
        }
        if (config.isRecordingCodeCoverage === undefined) {
            config.isRecordingCodeCoverage = true;
        }
        //ignore roku modules by default
        if (config.includeFilters === undefined) {
            config.includeFilters = [
                '**/*.spec.bs',
                '!**/BaseTestSuite.spec.bs',
                '!**/roku_modules/**/*'];
        }

        return config;
    }

    afterProgramCreate(program: Program) {
        this.fileFactory.addFrameworkFiles(program);
    }

    afterFileParse(file: BscFile): void {
        // console.log('afp', file.pkgPath);
        if (file.pathAbsolute.includes('/rooibos/bsc-plugin/dist/framework')) {
            // eslint-disable-next-line @typescript-eslint/dot-notation
            file['diagnostics'] = [];
            return;
        }
        if (this.fileFactory.isIgnoredFile(file) || !this.shouldSearchInFileForTests(file)) {
            return;
        }

        // console.log('processing ', file.pkgPath);
        if (isBrsFile(file)) {
            if (this.session.processFile(file)) {
                //
            } else {
                this.codeCoverageProcessor.addCodeCoverage(file);
            }
        }
    }

    beforePublish() { }

    beforeProgramTranspile(program: Program, entries: TranspileObj[], editor: AstEditor) {
        this.session.addTestRunnerMetadata(editor);
        this.session.addLaunchHook(editor);
        for (let testSuite of [...this.session.sessionInfo.testSuitesToRun.values()]) {
            let noEarlyExit = testSuite.annotation.noEarlyExit;
            if (noEarlyExit) {
                console.warn(`WARNING: testSuite "${testSuite.name}" is marked as noEarlyExit`);
            }

            testSuite.addDataFunctions(editor);
            for (let group of [...testSuite.testGroups.values()].filter((tg) => tg.isIncluded)) {
                for (let testCase of [...group.testCases.values()].filter((tc) => tc.isIncluded)) {
                    group.modifyAssertions(testCase, noEarlyExit, editor);
                }
            }
        }

        this.session.createNodeFiles(this._builder.program);
    }

    afterProgramTranspile(program: Program, entries: TranspileObj[], editor: AstEditor) {
        this.session.removeRooibosMain();
    }

    afterProgramValidate() {
        // console.log('bpv');
        this.session.updateSessionStats();
        for (let testSuite of [...this.session.sessionInfo.testSuites.values()]) {
            testSuite.validate();
        }
        for (let file of this.fileFactory.addedFrameworkFiles) {
            // eslint-disable-next-line @typescript-eslint/dot-notation
            file['diagnostics'] = [];
        }
    }

    shouldSearchInFileForTests(file: BscFile) {
        if (!this.config.includeFilters || this.config.includeFilters.length === 0) {
            return true;
        } else {
            for (let filter of this.config.includeFilters) {
                if (!minimatch(file.pathAbsolute, filter)) {
                    return false;
                }
            }
        }
        // console.log('including ', file.pkgPath);
        return true;
    }
}

export default () => {
    return new RooibosPlugin();
};
