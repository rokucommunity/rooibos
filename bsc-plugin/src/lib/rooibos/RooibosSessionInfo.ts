
import type {TestSuite} from './TestSuite';

export class SessionInfo {

    public ignoredCount = 0;
    public ignoredTestNames: string[] = [];
    public testSuites = new Map<string, TestSuite>();
    public testSuitesByPath = new Map<string, TestSuite[]>();
    public testSuitesToRun: TestSuite[] = [];
    public hasSoloSuites = false;
    public hasSoloGroups = false;
    public hasSoloTests = false;

    public updateTestSuites(testSuites: TestSuite[]) {
        //we can assume at this point that all suites coming in belong to same file
        //incase that is useful in future
        for (let testSuite of testSuites) {
            if (testSuite.isValid) {
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
            }
        }
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
        for (let testSuite of [...this.testSuites.values()]) {
            if (this.hasSoloTests && !testSuite.hasSoloTests) {
                testSuite.isIncluded = false;
            } else if (this.hasSoloSuites && !testSuite.isSolo) {
                testSuite.isIncluded = false;
            } else if (testSuite.isIgnored) {
                testSuite.isIncluded = false;
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

                //'GROUP  ' + testGroup.name);
                if (testGroup.isIgnored) {
                    this.ignoredCount += testGroup.ignoredTestCases.length;
                    this.ignoredTestNames.push(testGroup.name + ' [WHOLE GROUP]');
                    testGroup.isIncluded = false;
                } else {
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

                    if (this.hasSoloTests && !testGroup.hasSoloTests) {
                        testGroup.isIncluded = false;
                    } else if (this.hasSoloGroups && !testGroup.isSolo) {
                        testGroup.isIncluded = false;
                    } else {
                        testGroup.isIncluded = true;
                    }

                    if (testGroup.isIncluded) {
                        let testCases = [...testGroup.testCases.values()];

                        for (let testCase of testCases) {
                            if (this.hasSoloTests && !testCase.isSolo) {
                                testCase.isIncluded = false;
                            } else {
                                testCase.isIncluded = testGroup.isIncluded || testCase.isSolo;
                            }
                        }

                        for (let testCase of testGroup.soloTestCases) {
                            testCase.isIncluded = true;
                        }
                    }
                }
            }
        }
        this.testSuitesToRun = [...this.testSuites.values()].filter((s) => s.isIncluded);
    }
}

let _sessionInfo: SessionInfo;

export function getSessionInfo(): SessionInfo {
    return _sessionInfo;
}
