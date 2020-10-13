
import { BrsFile } from 'brighterscript';

import { TestSuite } from './TestSuite';
import { TestCase } from './TestCase';

export class SessionInfo {
  constructor(config: any) {
  }

  public ignoredCount: number = 0;
  public ignoredTestNames: string[] = [];
  public testSuites: Map<string, TestSuite> = new Map();
  public testSuitesByPath: Map<string, TestSuite[]> = new Map();
  public testSuitesToRun: TestSuite[] = [];
  public testCasesToRun: TestCase[] = [];
  public hasSoloSuites: boolean = false;
  public hasSoloGroups: boolean = false;
  public hasSoloTests: boolean = false;

  public updateTestSuites(testSuites: TestSuite[]) {
    //we can assume at this point that all suites coming in belong to same file
    //incase that is useful in future
    for (let testSuite of testSuites) {
      if (testSuite.isValid) {
        this.testSuites.set(testSuite.name, testSuite);

        this.addTestSuiteToPath(testSuite);
        if (testSuite.isSolo) {
          this.hasSoloSuites = true;
        }
        if (testSuite.hasSoloTests) {
          this.hasSoloTests = true;
        }
        if (testSuite.hasSoloGroups) {
          this.hasSoloGroups = true;
        }
      }
    }
  }

  private addTestSuiteToPath(testSuite: TestSuite) {
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
        this.ignoredTestNames.push('|-' + testSuite.name + ' [WHOLE SUITE]');
        this.ignoredCount++;
      } else {
        testSuite.isIncluded = true;
      }

      //'testSuite  ' + testSuite.name);
      testSuite.testGroups.forEach((testGroup) => {

        //'GROUP  ' + testGroup.name);
        if (testGroup.isIgnored) {
          this.ignoredCount += testGroup.ignoredTestCases.length;
          this.ignoredTestNames.push(testGroup.name + ' [WHOLE GROUP]');
        } else {
          if (testGroup.ignoredTestCases.length > 0) {
            this.ignoredTestNames.push(testGroup.name);
            this.ignoredCount += testGroup.ignoredTestCases.length;
            testGroup.ignoredTestCases.forEach((ignoredTestCase) => {
              if (!ignoredTestCase.isParamTest) {
                this.ignoredTestNames.push(ignoredTestCase.name);
              } else if (ignoredTestCase.paramTestIndex === 0) {
                let testCaseName = ignoredTestCase.name;
                if (testCaseName.length > 1 && testCaseName.substr(testCaseName.length - 1) === '0') {
                  testCaseName = testCaseName.substr(0, testCaseName.length - 1);
                }
                this.ignoredTestNames.push(testCaseName);
              }
            });
          }
          let testCases = [...testGroup.testCases.values()];
          if (this.hasSoloTests && !testGroup.hasSoloTests && !testGroup.isSolo) {
            testGroup.isIncluded = false;
          } else if (testCases.length === 0 && testGroup.soloTestCases.length === 0) {
            testGroup.isIncluded = false;
          } else {
            testGroup.isIncluded = testSuite.isIncluded;
          }

          for (let testCase of testCases) {
            if (this.hasSoloTests && !testCase.isSolo) {
              testCase.isIncluded = false;
            } else {
              testCase.isIncluded = testGroup.isIncluded || testCase.isSolo;
            }
          }

          for (let testCase of testGroup.soloTestCases) {
            testCase.isIncluded = true;
          };
        }
      });
    }
    this.testSuitesToRun = [...this.testSuites.values()].filter((s) => s.isIncluded);
  }
}

let _sessionInfo: SessionInfo;

export function getSessionInfo(): SessionInfo {
  return _sessionInfo;
}
