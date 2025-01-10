
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
    public hasSoloSuites = false;
    public hasSoloGroups = false;
    public hasSoloTests = false;
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
                if (testSuite.isSolo) {
                    this.hasSoloSuites = !this.hasSoloGroups && !this.hasSoloTests;
                }
                if (testSuite.hasSoloGroups) {
                    this.hasSoloGroups = !this.hasSoloTests;
                }
                if (testSuite.hasSoloTests) {
                    this.hasSoloTests = true;
                    this.hasSoloGroups = false;
                    this.hasSoloSuites = false;
                }
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
            if (this.isExcludedByTag(testSuite, false)) {
                testSuite.isIncluded = false;
            } else if (this.hasSoloTests && !testSuite.hasSoloTests) {
                testSuite.isIncluded = false;
            } else if (this.hasSoloSuites && !testSuite.isSolo) {
                testSuite.isIncluded = false;
            } else if (testSuite.isIgnored) {
                testSuite.isIncluded = true;
                this.ignoredTestNames.push(testSuite.name + ' [WHOLE SUITE]');
                this.ignoredCount++;
            } else {
                testSuite.isIncluded = true;
            }
            if (!testSuite.isIncluded) {
                continue;
            }
            //'testSuite  ' + testSuite.name);
            for (let testGroup of testSuite.getTestGroups()) {
                if (testSuite.isIgnored) {
                    testGroup.isIgnored = true;
                }

                //'GROUP  ' + testGroup.name);
                if (testGroup.isIgnored) {
                    this.ignoredCount += testGroup.ignoredTestCases.length;
                    this.ignoredTestNames.push(testGroup.name + ' [WHOLE GROUP]');
                    testGroup.isIncluded = true;
                }

                if (testGroup.ignoredTestCases.length > 0) {
                    this.ignoredTestNames.push(testGroup.name);
                    this.ignoredCount += testGroup.ignoredTestCases.length;
                    for (let ignoredTestCase of testGroup.ignoredTestCases) {
                        if (!ignoredTestCase.isParamTest) {
                            this.ignoredTestNames.push(ignoredTestCase.name);
                        } else if (ignoredTestCase.paramTestIndex === 0) {
                            let testCaseName = ignoredTestCase.name;
                            if (testCaseName.length > 1 && testCaseName.substr(testCaseName.length - 1) === '0') {
                                testCaseName = testCaseName.substr(0, testCaseName.length - 1);
                            }
                            this.ignoredTestNames.push(testCaseName);
                        }
                    }
                }
                if (this.isExcludedByTag(testGroup, true)) {
                    testGroup.isIncluded = false;
                } else if (this.hasSoloTests && !testGroup.hasSoloTests) {
                    testGroup.isIncluded = false;
                } else if (this.hasSoloGroups && !testGroup.isSolo) {
                    testGroup.isIncluded = false;
                } else {
                    testGroup.isIncluded = true;
                }

                if (testGroup.isIncluded) {
                    this.groupsCount++;
                    let testCases = [...testGroup.testCases.values()];

                    for (let testCase of testCases) {
                        if (testGroup.isIgnored) {
                            testCase.isIgnored = true;
                        }

                        if (this.isExcludedByTag(testCase, true)) {
                            testCase.isIncluded = false;
                        } else if (testCase.isIgnored) {
                            testCase.isIncluded = true;
                        } else if (this.hasSoloTests && !testCase.isSolo) {
                            testCase.isIncluded = false;
                        } else {
                            testCase.isIncluded = testGroup.isIncluded || testCase.isSolo;
                        }
                    }

                    for (let testCase of testGroup.soloTestCases) {
                        if (this.isExcludedByTag(testCase, true)) {
                            testCase.isIncluded = false;
                        } else {
                            testCase.isIncluded = true;
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

        this.hasSoloTests = false;
        this.hasSoloGroups = false;
        this.hasSoloSuites = false;

        for (let testSuite of [...this.testSuites.values()]) {

            if (testSuite.isValid && !this.isExcludedByTag(testSuite, false)) {
                if (testSuite.isSolo) {
                    this.hasSoloSuites = !this.hasSoloGroups && !this.hasSoloTests;
                }
                if (testSuite.hasSoloGroups) {
                    this.hasSoloGroups = !this.hasSoloTests;
                }
                if (testSuite.hasSoloTests) {
                    this.hasSoloTests = true;
                    this.hasSoloGroups = false;
                    this.hasSoloSuites = false;
                }
            }
        }
        this.suitesCount = this.testSuites.size;
    }
}

let _sessionInfo: SessionInfo;

export function getSessionInfo(): SessionInfo {
    return _sessionInfo;
}
