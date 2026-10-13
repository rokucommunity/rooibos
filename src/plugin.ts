import type {
    BscFile,
    CompilerPlugin,
    ProgramBuilder,
    XmlFile,
    OnPrepareFileEvent,
    BeforePrepareFileEvent,
    BeforeBuildProgramEvent,
    AfterProvideFileEvent,
    BeforeProvideProgramEvent,
    AfterRemoveFileEvent,
    AfterProvideProgramEvent,
    AfterValidateProgramEvent,
    AfterPrepareProgramEvent,
    ValidateScopeEvent
} from 'brighterscript';
import {
    isBrsFile,
    isXmlFile,
    util,
    standardizePath
} from 'brighterscript';
import { RooibosSession } from './lib/rooibos/RooibosSession';
import { CodeCoverageProcessor } from './lib/rooibos/CodeCoverageProcessor';
import { FileFactory } from './lib/rooibos/FileFactory';
import type { RooibosConfig } from './lib/rooibos/RooibosConfig';
import { normalizeCodeCoverage } from './lib/rooibos/RooibosConfig';
import * as minimatch from 'minimatch';
import * as path from 'path';
import { MockUtil } from './lib/rooibos/MockUtil';
import { getScopeForSuite, getUnresolvedNameDiagnostics } from './lib/rooibos/Utils';
import { AnnotationType, getAnnotationType } from './lib/rooibos/Annotation';
import { RooibosLogPrefix } from './lib/utils/Diagnostics';

const paramsValidationTag = 'rooibos-params-validation';

export class RooibosPlugin implements CompilerPlugin {

    public name = 'rooibosPlugin';
    public session: RooibosSession;
    public codeCoverageProcessor: CodeCoverageProcessor;
    public mockUtil: MockUtil;
    public fileFactory: FileFactory;
    public _builder: ProgramBuilder;
    public config: RooibosConfig;

    beforeProvideProgram(event: BeforeProvideProgramEvent): void {
        const builder = event.builder;
        this._builder = builder;

        this.config = this.getConfig((builder.options as any).rooibos || {});

        this.fileFactory = new FileFactory();
        if (!this.session) {
            this.session = new RooibosSession(builder, this.fileFactory);
            this.codeCoverageProcessor = new CodeCoverageProcessor(builder, this.fileFactory);
            this.mockUtil = new MockUtil(builder, this.session);
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
        if (config.colorizeOutput === undefined) {
            config.colorizeOutput = false;
        }
        if (config.throwOnFailedAssertion === undefined) {
            config.throwOnFailedAssertion = false;
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
        normalizeCodeCoverage(config);
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
            '**/source/rooibos/**/*',
            '**/components/rooibos/**/*'
        ];

        // Set default coverage exclusions, or merge with defaults if available.
        if (config.coverageExcludedFiles === undefined) {
            config.coverageExcludedFiles = defaultCoverageExcluded;
        } else {
            config.coverageExcludedFiles.push(...defaultCoverageExcluded);
        }

        const defaultGlobalMethodMockingExcluded = [
            '**/*.spec.bs',
            '**/source/main.bs',
            '**/source/rooibos/**/*',
            '**/components/rooibos/**/*'
        ];
        if (config.globalMethodMockingExcludedFiles === undefined) {
            config.globalMethodMockingExcludedFiles = defaultGlobalMethodMockingExcluded;
        }

        return config;
    }

    afterProvideProgram(event: AfterProvideProgramEvent) {
        this.fileFactory.addFrameworkFiles(event.program);
    }

    afterRemoveFile(event: AfterRemoveFileEvent) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const xmlFile = event.file['rooibosXmlFile'] as XmlFile;
        if (xmlFile) {
            // Remove the old generated xml files
            this._builder.program.removeFile(xmlFile.srcPath);
        }
    }

    afterProvideFile(event: AfterProvideFileEvent): void {
        for (const file of event.files) {

            if (!(isBrsFile(file) || isXmlFile(file)) || this.shouldSkipFile(file)) {
                continue;
            }
            if (util.pathToUri(file.srcPath).includes('/rooibos/bsc-plugin/dist/framework')) {
                // eslint-disable-next-line @typescript-eslint/dot-notation
                return;
            }
            if (this.fileFactory.isIgnoredFile(file) || !this.shouldSearchInFileForTests(file)) {
                return;
            }
            event.program.logger.log(RooibosLogPrefix, 'Processing test file', file.pkgPath);

            if (isBrsFile(file)) {
                // Add the node test component so brighter script can validate the test files
                let suites = this.session.processFile(file);
                let nodeSuites = suites.filter((ts) => ts.isNodeTest);
                for (const suite of nodeSuites) {
                    const xmlFile = this._builder.program.setFile({
                        src: path.resolve(suite.xmlPkgPath),
                        dest: suite.xmlPkgPath
                    }, this.session.getNodeTestXmlText(suite));
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    file['rooibosXmlFile'] = xmlFile;
                    event.files.push(xmlFile);
                }
            }
        }
    }

    beforeBuildProgram(event: BeforeBuildProgramEvent) {
        // coverage ids are build-order counters; a program can build more than
        // once, so all cross-file coverage state resets per pass
        this.codeCoverageProcessor.onBeforeBuildProgram(event.program);
        const createdFiles = this.session.prepareForTranspile(event.editor, event.program, this.mockUtil);
        this.addFilesToBuild(event.files, createdFiles);

        //this must happen before bsc's `prepareFile` (which runs before ours), so bsc will inline any enums/constants used in the `@params`
        for (const testSuite of this.session.sessionInfo.testSuitesToRun) {
            testSuite.addDataFunctions(event.editor);
        }

        //generate the entry point here (rather than after the build) so it flows through prepare/serialize/write
        const launchHookFile = this.session.addLaunchHookFileIfNotPresent(event.program);
        if (launchHookFile) {
            this.addFilesToBuild(event.files, [launchHookFile]);
        }
    }

    /**
     * Add the given files to a build's file list. If the build already includes a (now stale) file instance
     * for a path, replace it rather than adding a duplicate. Two instances for the same path would both be
     * serialized, racing to write the same output file (which intermittently produces corrupt output).
     */
    private addFilesToBuild(buildFiles: BscFile[], filesToAdd: BscFile[]) {
        for (const file of filesToAdd) {
            const existingIndex = buildFiles.findIndex(x => x.destPath === file.destPath);
            if (existingIndex >= 0) {
                buildFiles[existingIndex] = file;
            } else {
                buildFiles.push(file);
            }
        }
    }

    beforePrepareFile(event: BeforePrepareFileEvent) {
        if (this.shouldSkipFile(event.file)) {
            return;
        }
        //coverage must instrument the source as written, before bsc's own `prepareFile` rewrites it
        //(i.e. lowering a ternary assignment into an if/else statement)
        if (isBrsFile(event.file) && this.shouldAddCodeCoverageToFile(event.file)) {
            this.codeCoverageProcessor.addCodeCoverage(event.file, event.editor);
        }
    }

    prepareFile(event: OnPrepareFileEvent) {
        if (this.shouldSkipFile(event.file)) {
            return;
        }
        const testSuites = this.session.sessionInfo.testSuitesToRun.filter((ts) => ts.file.pkgPath === event.file.pkgPath);
        for (const testSuite of testSuites) {
            const scope = getScopeForSuite(testSuite);
            let noEarlyExit = testSuite.annotation.noEarlyExit;
            if (noEarlyExit) {
                event.program.logger.warn(RooibosLogPrefix, `TestSuite "${testSuite.name}" is marked as noEarlyExit`);
            }

            const modifiedTestCases = new Set();
            const modifiedHookFunctions = new Set();
            for (let group of [...testSuite.testGroups.values()].filter((tg) => tg.isIncluded)) {
                for (const hookName of [group.setupFunctionName, group.tearDownFunctionName, group.beforeEachFunctionName, group.afterEachFunctionName]) {
                    if (hookName) {
                        const hookKey = group.testSuite.generatedNodeName + group.file.pkgPath + hookName.toLowerCase();
                        if (!modifiedHookFunctions.has(hookKey)) {
                            group.modifyAssertionsForHook(hookName, noEarlyExit, event.editor as any, this.session.namespaceLookup, scope);
                            modifiedHookFunctions.add(hookKey);
                        }
                    }
                }
                for (let testCase of [...group.testCases].filter((tc) => tc.isIncluded)) {
                    let caseName = group.testSuite.generatedNodeName + group.file.pkgPath + testCase.funcName;
                    if (!modifiedTestCases.has(caseName)) {
                        group.modifyAssertions(testCase, noEarlyExit, event.editor as any, this.session.namespaceLookup, scope);
                        modifiedTestCases.add(caseName);
                    }

                }
            }
        }

        if (isBrsFile(event.file)) {
            if (this.shouldEnableGlobalMocksOnFile(event.file)) {
                this.mockUtil.enableGlobalMethodMocks(event.file, event.editor);
            }
        }
    }

    afterPrepareProgram(event: AfterPrepareProgramEvent) {
        //coverage metadata is gathered during `beforePrepareFile`, so it isn't complete until every file is prepared
        const coverageFiles = this.codeCoverageProcessor.generateMetadata(this.config.codeCoverage, event.program);
        this.addFilesToBuild(event.files, coverageFiles);
    }

    validateScope(event: ValidateScopeEvent) {
        event.program.diagnostics.clearByFilter({ scope: event.scope, tag: paramsValidationTag });
        for (const testSuite of this.session.sessionInfo.testSuites.values()) {
            if (getScopeForSuite(testSuite) !== event.scope) {
                continue;
            }
            for (const statement of testSuite.classStatement?.body ?? []) {
                for (const annotation of statement.annotations ?? []) {
                    const annotationType = getAnnotationType(annotation.name);
                    if (annotationType === AnnotationType.Params || annotationType === AnnotationType.SoloParams || annotationType === AnnotationType.IgnoreParams) {
                        event.program.diagnostics.register(getUnresolvedNameDiagnostics(annotation), { scope: event.scope, tags: [paramsValidationTag] });
                    }
                }
            }
        }
    }

    afterValidateProgram(event: AfterValidateProgramEvent) {
        this.session.updateSessionStats();
        for (let testSuite of [...this.session.sessionInfo.testSuites.values()]) {
            testSuite.validate();
        }
        for (let file of this.fileFactory.addedFrameworkFiles) {
            // eslint-disable-next-line @typescript-eslint/dot-notation
            // file['diagnostics'] = [];
            event.program.diagnostics.clearForFile(file.srcPath);
        }
    }

    shouldSearchInFileForTests(file: BscFile) {
        if (!this.config.includeFilters || this.config.includeFilters.length === 0) {
            return true;
        } else {
            for (let filter of this.config.includeFilters) {
                if (!minimatch(file.srcPath, filter, { dot: true })) {
                    return false;
                }
            }
        }
        return true;
    }
    shouldAddCodeCoverageToFile(file: BscFile) {
        if (!isBrsFile(file) || !this.config.codeCoverage) {
            return false;
            //rooibos' own generated files (the framework, and the generated entry point) are never instrumented
        } else if (this.fileFactory.isIgnoredFile(file)) {
            return false;
        } else if (!this.config.coverageExcludedFiles) {
            return true;
        } else {
            for (let filter of this.config.coverageExcludedFiles) {
                if (minimatch(file.destPath, filter, { dot: true, nocase: true })) {
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
                if (minimatch(file.destPath, filter, { dot: true, nocase: true })) {
                    // console.log('±±±skipping file', file.pkgPath);
                    return false;
                }
            }
        }
        return true;
    }

    private shouldSkipFile(file: BscFile) {
        return file.pkgPath.toLowerCase().includes(standardizePath('source/bslib.brs'));
    }
}

export default () => {
    return new RooibosPlugin();
};
