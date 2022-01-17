import type {
    BrsFile,
    BscFile,
    Program,
    ProgramBuilder,
    TranspileObj,
    XmlFile
} from 'brighterscript';

import { isBrsFile } from 'brighterscript/dist/astUtils';

import { RooibosSession } from './lib/rooibos/RooibosSession';

import { CodeCoverageProcessor } from './lib/rooibos/CodeCoverageProcessor';
import { FileFactory } from './lib/rooibos/FileFactory';
import type { RooibosConfig } from './lib/rooibos/RooibosConfig';


import * as minimatch from 'minimatch';

export class RooibosPlugin {

    name: 'rooibosPlugin';
    public session: RooibosSession;
    public codeCoverageProcessor: CodeCoverageProcessor;
    public fileFactory: FileFactory;
    public isFrameworkAdded = false;
    public _builder: ProgramBuilder;
    public config: RooibosConfig;

    beforeProgramCreate(builder: ProgramBuilder): void {
        this._builder = builder;

        this.config = this.getConfig((builder.options as any).rooibos || {});

        this.fileFactory = new FileFactory(this.config);
        if (!this.session) {
            this.session = new RooibosSession(builder, this.fileFactory);
            this.codeCoverageProcessor = new CodeCoverageProcessor(builder, this.fileFactory);
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
            config.isRecordingCodeCoverage = false;
        }
        //ignore roku modules by default
        if (config.includeFilters === undefined) {
            config.includeFilters = [
                '**/*.spec.bs',
                '!**/BaseTestSuite.spec.bs',
                '!**/roku_modules/**/*'];
        }

        if (config.coverageExcludedFiles === undefined) {
            config.coverageExcludedFiles = [
                '**/*.spec.bs',
                '**/roku_modules/**/*'
            ];
        }

        return config;
    }

    afterProgramCreate(program: Program) {
        if (!this.isFrameworkAdded) {
            this.fileFactory.addFrameworkFiles(program);
        }
    }

    afterFileParse(file: (BrsFile | XmlFile)): void {
        // console.log('afp', file.pkgPath);
        if (this.fileFactory.isIgnoredFile(file) || !this.shouldSearchInFileForTests(file)) {
            return;
        }

        // console.log('processing ', file.pkgPath);
        if (isBrsFile(file)) {
            if (this.session.processFile(file)) {
            }
        }
    }

    beforeFileTranspile (entry: TranspileObj) {
        // console.log('afp', file.pkgPath)
        let file = entry.file;
        if (isBrsFile(file) && this.shouldAddCodeCoverageToFile(file)) {
            this.codeCoverageProcessor.addCodeCoverage(file);
        }
    }

    beforePublish() {
        // console.log('bp');
        for (let testSuite of [...this.session.sessionInfo.testSuitesToRun.values()]) {
            let noEarlyExit = testSuite.annotation.noEarlyExit;
            if (noEarlyExit) {
                console.warn(`WARNING: testSuite "${testSuite.name}" is marked as noEarlyExit`);
            }

            testSuite.addDataFunctions();
            for (let group of [...testSuite.testGroups.values()].filter((tg) => tg.isIncluded)) {
                for (let testCase of [...group.testCases.values()].filter((tc) => tc.isIncluded)) {
                    group.modifyAssertions(testCase, noEarlyExit);
                }
            }
        }

        for (let testSuite of [...this.session.sessionInfo.allTestSuites.values()].filter((ts) => !ts.isIncluded)) {
            testSuite.removeCode();
        }

        this.session.addTestRunnerMetadata();
        this.session.addLaunchHook();
        this.session.createNodeFiles(this._builder.program);
        this.codeCoverageProcessor.generateMetadata(this.config.isRecordingCodeCoverage);
    }

    beforeProgramValidate() {
        // console.log('bpv');
        this.session.updateSessionStats();
        for (let testSuite of [...this.session.sessionInfo.testSuites.values()]) {
            testSuite.validate();
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
    shouldAddCodeCoverageToFile(file: BscFile) {
        if (!isBrsFile(file) || !this.config.isRecordingCodeCoverage) {
            return false;
        } else if (!this.config.coverageExcludedFiles) {
            return true;
        } else {
            for (let filter of this.config.coverageExcludedFiles) {
                if (minimatch(file.pathAbsolute, filter)) {
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
