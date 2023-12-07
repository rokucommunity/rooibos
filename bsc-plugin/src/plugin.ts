import type {
    BscFile,
    CompilerPlugin,
    Program,
    ProgramBuilder,
    TranspileObj,
    Editor,
    BeforePrepareProgramEvent,
    AfterProgramCreateEvent,
    BeforeProgramCreateEvent,
    AfterProgramValidateEvent,
    BeforeSerializeFileEvent,
    File,
    PluginHandler,
    BeforePrepareFileEvent,
    AfterSerializeProgramEvent,
    AfterProvideFileEvent,
    AfterFileAddEvent,
    BeforeWriteProgramEvent,
    AfterPrepareFileEvent
} from 'brighterscript';
import {
    isBrsFile, isXmlFile
} from 'brighterscript';
import { RooibosSession } from './lib/rooibos/RooibosSession';
import { CodeCoverageProcessor } from './lib/rooibos/CodeCoverageProcessor';
import { FileFactory } from './lib/rooibos/FileFactory';
import type { RooibosConfig } from './lib/rooibos/RooibosConfig';
import * as minimatch from 'minimatch';
import { MockUtil } from './lib/rooibos/MockUtil';

export class RooibosPlugin implements CompilerPlugin {

    public name = 'rooibosPlugin';
    public session: RooibosSession;
    public codeCoverageProcessor: CodeCoverageProcessor;
    public mockUtil: MockUtil;
    public fileFactory: FileFactory;
    public _builder: ProgramBuilder;
    public config: RooibosConfig;

    beforeProgramCreate(event: BeforeProgramCreateEvent): void {
        const builder = event.builder;
        this._builder = event.builder;

        this.config = this.getConfig((builder.options as any).rooibos || {});

        this.fileFactory = new FileFactory(this.config);
        if (!this.session) {
            this.session = new RooibosSession(builder, this.fileFactory);
            this.codeCoverageProcessor = new CodeCoverageProcessor(builder, this.fileFactory);
            this.mockUtil = new MockUtil(builder, this.fileFactory, this.session);
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
        if (config.isGlobalMethodMockingEnabled === undefined) {
            config.isGlobalMethodMockingEnabled = false;
        }
        if (config.isGlobalMethodMockingEfficientMode === undefined) {
            config.isGlobalMethodMockingEfficientMode = true;
        }
        if (config.keepAppOpen === undefined) {
            config.keepAppOpen = true;
        }
        if (config.testSceneName === undefined) {
            config.testSceneName = 'RooibosScene';
        }
        //ignore roku modules by default
        if (config.includeFilters === undefined) {
            config.includeFilters = [
                '**/*.spec.bs',
                '!**/BaseTestSuite.spec.bs',
                '!**/roku_modules/**/*'];
        }

        const defaultCoverageExcluded = [
            '**/*.spec.bs',
            '**/roku_modules/**/*',
            '**/source/main.bs',
            '**/source/rooibos/**/*'
        ];

        // Set default coverage exclusions, or merge with defaults if available.
        if (config.coverageExcludedFiles === undefined) {
            config.coverageExcludedFiles = defaultCoverageExcluded;
        } else {
            config.coverageExcludedFiles.push(...defaultCoverageExcluded);
        }

        const defaultGlobalMethodMockingExcluded = [
            '**/*.spec.bs',
            '**/roku_modules/**/*',
            '**/source/main.bs',
            '**/source/rooibos/**/*'
        ];
        if (config.globalMethodMockingExcludedFiles === undefined) {
            config.globalMethodMockingExcludedFiles = defaultGlobalMethodMockingExcluded;
        }

        return config;
    }

    afterProgramCreate(event: AfterProgramCreateEvent) {
        this.fileFactory.addFrameworkFiles(event.program);
    }

    afterFileAdd(event: AfterFileAddEvent) {
        // console.log('afp', file.pkgPath);
        const file = event.file;
        if (!isBrsFile(file) && !isXmlFile(file)) {
            return;
        }
        if (file.srcPath.includes('/rooibos/bsc-plugin/dist/framework')) {
            // eslint-disable-next-line @typescript-eslint/dot-notation
            file['diagnostics'] = [];
            return;
        }
        if (this.fileFactory.isIgnoredFile(file) || !this.shouldSearchInFileForTests(file)) {
            return;
        }

        // console.log('processing ', file.pkgPath);
        if (isBrsFile(file)) {
            this.session.processFile(file);
        }
    }

    beforePrepareProgram(event: BeforePrepareProgramEvent) {
        this.session.prepareForTranspile(event.editor, event.program, this.mockUtil);
    }

    afterSerializeProgram(event: AfterSerializeProgramEvent) {
        this.codeCoverageProcessor.generateMetadata(this.config.isRecordingCodeCoverage, event.program);
        this.session.addLaunchHookFileIfNotPresent(event);
    }

    // beforePrepareFile(event: BeforePrepareFileEvent) {
    afterPrepareFile(event: AfterPrepareFileEvent) {
        const file = event.file;
        if (!isBrsFile(file) && !isXmlFile(file)) {
            return;
        }
        let testSuite = this.session.sessionInfo.testSuitesToRun.find((ts) => ts.file.pkgPath === event.file.pkgPath);
        if (testSuite) {
            let noEarlyExit = testSuite.annotation.noEarlyExit;
            if (noEarlyExit) {
                console.warn(`WARNING: testSuite "${testSuite.name}" is marked as noEarlyExit`);
            }

            testSuite.addDataFunctions(event.editor as any);
            for (let group of [...testSuite.testGroups.values()].filter((tg) => tg.isIncluded)) {
                for (let testCase of [...group.testCases.values()].filter((tc) => tc.isIncluded)) {
                    group.modifyAssertions(testCase, noEarlyExit, event.editor as any, this.session.namespaceLookup);
                }
            }
            if (testSuite.isNodeTest) {
                this.session.createNodeFile(event.program, testSuite);
            }
        }

        if (isBrsFile(event.file)) {
            if (this.shouldAddCodeCoverageToFile(event.file)) {
                this.codeCoverageProcessor.addCodeCoverage(event.file, event.editor);
            }
            if (this.shouldEnableGlobalMocksOnFile(event.file)) {
                this.mockUtil.enableGlobalMethodMocks(event.file, event.editor);
            }
        }
    }

    afterProgramValidate(event: AfterProgramValidateEvent) {
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
                if (!minimatch(file.srcPath, filter)) {
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
                if (minimatch(file.pkgPath, filter)) {
                    return false;
                }
            }
        }
        return true;
    }

    shouldEnableGlobalMocksOnFile(file: BscFile) {
        if (!isBrsFile(file) || !this.config.isGlobalMethodMockingEnabled) {
            return false;
        } else if (!this.config.globalMethodMockingExcludedFiles) {
            return true;
        } else {
            for (let filter of this.config.globalMethodMockingExcludedFiles) {
                if (minimatch(file.pkgPath, filter)) {
                    // console.log('±±±skipping file', file.pkgPath);
                    return false;
                }
            }
        }
        return true;
    }

}

export default () => {
    return new RooibosPlugin();
};
