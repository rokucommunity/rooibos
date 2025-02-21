
import type { RooibosConfig } from './RooibosConfig';
import type { TestSuite } from './TestSuite';
import type { TestGroup } from './TestGroup';
import type { TestCase } from './TestCase';

export class SessionInfo {

    public ignoredCount = 0;
    public ignoredTestNames: string[] = [];
    public allTestSuites = new Set<TestSuite>();
    public testSuites = new Map<string, TestSuite>();
    public testSuitesByPath = new Map<string, TestSuite[]>();
    public testSuitesToRun: TestSuite[] = [];
    public shouldRunSolo = false;
    public testsCount = 0;
    public suitesCount = 0;
    public groupsCount = 0;
    public includeTags = [];
    public excludeTags = [];
    constructor(public config: RooibosConfig) {
        for (let tag of config.tags || []) {
            if (tag.startsWith('!')) {
                this.excludeTags.push(tag.substr(1));
            } else {
                this.includeTags.push(tag);
            }
        }
    }

    public updateTestSuites(testSuites: TestSuite[]) {
        //we can assume at this point that all suites coming in belong to same file
        //incase that is useful in future
        for (let testSuite of testSuites) {
            if (testSuite.isValid && !this.isExcludedByTag(testSuite, false)) {
                this.testSuites.set(testSuite.name, testSuite);
                this.addTestSuiteToPath(testSuite);

                this.shouldRunSolo = this.shouldRunSolo || testSuite.isSolo || testSuite.hasSoloGroups || testSuite.hasSoloTests;
            } else {
                this.allTestSuites.add(testSuite);
            }
        }
        this.suitesCount = this.testSuites.size;
    }

    public addTestSuiteToPath(testSuite: TestSuite) {
        let suites = this.testSuitesByPath.get(testSuite.file.pkgPath) || [];
        //TODO - I think we could end up with duplicate suites in this case..
        suites.push(testSuite);
        this.testSuitesByPath.set(testSuite.file.pkgPath, suites);
    }

    /**
     * Once we know what's ignored/solo/etc, we can ascertain if we're going
     * to include it in the final json payload
     */
    public updateInfo() {
        this.resetCounts();
        for (let testSuite of [...this.testSuites.values()]) {
            testSuite.isIncluded = false;
            testSuite.isIgnored = testSuite.isIgnored || this.isExcludedByTag(testSuite, false);

            if (this.shouldRunSolo) {
                if (!testSuite.isIgnored && (testSuite.isSolo || testSuite.hasSoloGroups || testSuite.hasSoloTests)) {
                    testSuite.isIncluded = true;
                }
            } else {
                testSuite.isIncluded = true;
                if (testSuite.isIgnored) {
                    this.ignoredTestNames.push(testSuite.name + ' [WHOLE SUITE]');
                    this.ignoredCount++;
                }
            }

            if (!testSuite.isIncluded) {
                continue;
            }
            //'testSuite  ' + testSuite.name);
            for (let testGroup of testSuite.getTestGroups()) {
                testGroup.isIgnored = testGroup.isIgnored || testSuite.isIgnored || this.isExcludedByTag(testGroup, true);
                testGroup.isIncluded = false;

                if (this.shouldRunSolo) {
                    if (!testGroup.isIgnored) {
                        if (testGroup.hasSoloTests || testGroup.isSolo || (testSuite.isSolo && !testSuite.hasSoloGroups)) {
                            testGroup.isIncluded = true;
                        }
                    }
                } else {
                    testGroup.isIncluded = true;
                    if (testGroup.isIgnored) {
                        this.ignoredTestNames.push(testGroup.name + ' [WHOLE GROUP]');
                        this.ignoredCount += testGroup.testCases.length;
                    }
                }

                if (testGroup.isIncluded) {
                    if (testGroup.isIncluded) {
                        this.groupsCount++;
                    }
                    let testCases = [...testGroup.testCases];

                    for (let testCase of testCases) {
                        testCase.isIncluded = false;
                        testCase.isIgnored = testCase.isIgnored || testGroup.isIgnored || this.isExcludedByTag(testCase, true);

                        if (this.shouldRunSolo) {
                            if (!testCase.isIgnored) {
                                if (testGroup.hasSoloTests) {
                                    testCase.isIncluded = testCase.isSolo;
                                } else if (testGroup.isSolo || testSuite.isSolo) {
                                    testCase.isIncluded = true;
                                }
                            }
                        } else {
                            testCase.isIncluded = true;
                            if (testCase.isIgnored) {
                                if (!testCase.isParamTest) {
                                    this.ignoredTestNames.push(testCase.name);
                                } else if (testCase.paramTestIndex === 0) {
                                    let testCaseName = testCase.name;
                                    if (testCaseName.length > 1 && testCaseName.substr(testCaseName.length - 1) === '0') {
                                        testCaseName = testCaseName.substr(0, testCaseName.length - 1);
                                    }
                                    this.ignoredTestNames.push(testCaseName);
                                }
                            }
                        }
                    }

                    for (let testCase of testCases) {
                        if (testCase.isIncluded) {
                            this.testsCount++;
                        }
                    }
                }
            }
        }
        this.testSuitesToRun = [...this.testSuites.values()].filter((s) => s.isIncluded);
        this.testSuitesToRun.sort((a, b) => a.name.localeCompare(b.name));
    }

    isExcludedByTag(item: TestCase | TestGroup | TestSuite, isParentIncluded) {
        if (this.excludeTags.length > 0) {
            for (let tag of this.excludeTags) {
                if (item.annotation.tags.has(tag)) {
                    return true;
                }
            }
        }
        if (this.includeTags.length > 0 && (item.annotation.tags.size > 0 || !isParentIncluded)) {
            for (let tag of this.includeTags) {
                if (!item.annotation.tags.has(tag)) {
                    return true;
                }
            }
        }
        return false;
    }

    private resetCounts() {
        this.shouldRunSolo = false;

        for (let testSuite of [...this.testSuites.values()]) {
            if (testSuite.isValid && !this.isExcludedByTag(testSuite, false)) {
                this.shouldRunSolo = this.shouldRunSolo || testSuite.isSolo || testSuite.hasSoloGroups || testSuite.hasSoloTests;
            }
        }
        this.suitesCount = this.testSuites.size;
    }
}

let _sessionInfo: SessionInfo;

export function getSessionInfo(): SessionInfo {
    return _sessionInfo;
}
