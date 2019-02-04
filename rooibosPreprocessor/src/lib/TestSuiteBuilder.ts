import * as Debug from 'debug';

import FileDescriptor from './FileDescriptor';
import { ItGroup } from './ItGroup';
import { Tag } from './Tag';
import { TestCase } from './TestCase';
import { TestSuite } from './TestSuite';
import { expect } from 'chai';

const debug = Debug('RooibosProcessor');

interface INameCounts {
  [filename: string]: number;
}

export class TestSuiteBuilder {
  constructor(maxLinesWithoutSuiteDirective: number) {
    this._maxLinesWithoutSuiteDirective = maxLinesWithoutSuiteDirective;
    this.functionNameRegex = new RegExp('^\\s*(function|sub)\\s*([0-9a-z_]*)s*\\(', 'i');
    this.functionSignatureRegex = new RegExp('^\\s*(function|sub)\\s*[0-9a-z_]*s*\\((.*)\\)', 'i');
    this.assertInvocationRegex = new RegExp('^\s*(testSuite.fail|testSuite.Fail|testSuite.assert|testSuite.Assert)(.*)\\(', 'i');
    this.functionEndRegex = new RegExp('^\s*(end sub|end function)', 'i');
    this._warnings = [];
    this._errors = [];
  }

  private readonly _warnings: string[];
  private readonly _errors: string[];

  private _maxLinesWithoutSuiteDirective: number;
  private groupNameCounts: INameCounts;
  public currentGroup?: ItGroup;
  private functionEndRegex: RegExp;
  private functionNameRegex: RegExp;
  private functionSignatureRegex: RegExp;
  private assertInvocationRegex: RegExp;

  private hasCurrentTestCase: boolean;
  private testCaseParams: object[];
  private testCaseParamLines: number[];
  private testCaseOnlyParams: object[];
  private testCaseOnlyParamLines: number[];
  private currentTestCases: TestCase[];

  public get errors(): string[] {
    return this._errors;
  }

  public get warnings(): string[] {
    return this._warnings;
  }
  get maxLinesWithoutSuiteDirective(): number {
    return this._maxLinesWithoutSuiteDirective;
  }

  public processFile(fileDescriptor: FileDescriptor, rootPath?: string): TestSuite {
    'find a marker to indicate this is a test suit';
    let code = fileDescriptor ? fileDescriptor.fileContents : null;
    let testSuite = new TestSuite();
    if (!code || !code.trim()) {
      debug(`no code for current descriptor`);
      this.errors.push('No code for file' + (fileDescriptor ? fileDescriptor.fullPath : `unknown file`));
      return testSuite;
    }
    let isTokenItGroup = false;
    let isNextTokenIgnore = false;
    let isNextTokenSolo = false;
    let isNextTokenTest = false;
    let isTestSuite = false;
    let isNextTokenSetup = false;
    let isNextTokenTearDown = false;
    let isNextTokenBeforeEach = false;
    let isNextTokenAfterEach = false;
    let isNextTokenNodeTest = false;
    let isNextTokenTestCaseParam = false;

    let nodeTestFileName = '';
    let nextName = '';
    let name = fileDescriptor.normalizedFileName;
    let filename = fileDescriptor.normalizedFileName;
    let lineNumber = 0;
    this.reset();
    let currentLocation = '';
    let lines = code.split(/\r?\n/);
    let filePath = fileDescriptor.fullPath;
    testSuite.filePath = fileDescriptor.getPackagePath(rootPath || '');
    this.groupNameCounts = {};
    this.currentGroup = null;
    this.reset();

    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      currentLocation = filePath + ':' + lineNumber.toString();
      let line = lines[lineNumber];
      if (lineNumber > this._maxLinesWithoutSuiteDirective && !isTestSuite) {
        debug('IGNORING FILE WITH NO TESTSUITE DIRECTIVE : ' + currentLocation);
        this.warnings.push('Ignoring file with no test suite directive' + fileDescriptor.fullPath);
        break;
      }
      if (this.isTag(line, Tag.TEST_SUITE)) {
        if (isTestSuite) {
          debug(`Multiple suites per file are !supported - use '@It tag`);
          this.warnings.push('Multiple suites per file are !supported - use \'@It tag' + currentLocation);
        }

        name = this.getTagText(line, Tag.TEST_SUITE);

        if (name) {
          testSuite.name = name;
        }

        if (isNextTokenSolo) {
          testSuite.isSolo = true;
          testSuite.name += ` [ONLY]`;
        }
        isTestSuite = true;
        testSuite.isValid = true;
        if (isNextTokenNodeTest) {
          testSuite.nodeTestFileName = nodeTestFileName;
          testSuite.isNodeTest = true;
        }

        if (isNextTokenIgnore) {
          testSuite.isIgnored = true;
          break;
        }

        isNextTokenSolo = false;
        isNextTokenIgnore = false;
        isNextTokenNodeTest = false;

        continue;
      } else if (this.isTag(line, Tag.IT)) {
        if (!isTestSuite) {
          debug(`File !identified as testsuite!`);
        }

        name = this.getTagText(line, Tag.IT);

        if (name === ``) {
          name = `UNNAMED Tag.TEST GROUP - name this group for better readability - e.g. 'Tests the Load method... '`;
        }

        if (!this.groupNameCounts[name]) {
          this.groupNameCounts[name] = 0;
        }

        let nameCount = this.groupNameCounts[name];
        nameCount++;
        this.groupNameCounts[name] = nameCount;
        if (nameCount > 1) {
          debug(`WARNING A Group already exists with the name '` + name + ` changing name to avoid collisions. New Name:`);
          this.warnings.push(`WARNING A Group already exists with the name '` + name + ` changing name to avoid collisions. New Name:` + currentLocation);

          name = `WARNING!! DUPLICATE_` + (nameCount - 1).toString().trim() + `: ` + name;
        }

        this.currentGroup = new ItGroup(name, isNextTokenSolo, isNextTokenIgnore, filename);

        // 'inherit all suite functions that were set up to no';
        this.currentGroup.setupFunctionName = testSuite.setupFunctionName;
        this.currentGroup.tearDownFunctionName = testSuite.tearDownFunctionName;
        this.currentGroup.beforeEachFunctionName = testSuite.beforeEachFunctionName;
        this.currentGroup.afterEachFunctionName = testSuite.afterEachFunctionName;

        testSuite.itGroups.push(this.currentGroup);
        if (isNextTokenSolo) {
          testSuite.hasSoloGroups = true;
          testSuite.isSolo = true;
        }
        isTokenItGroup = true;
      } else if (this.isTag(line, Tag.SOLO) && !this.isTag(line, Tag.TEST_SOLO_PARAMS)) {
        if (isNextTokenSolo) {
          debug(`Tag.TEST MARKED FOR Tag.IGNORE AND Tag.SOLO`);
          this.warnings.push(`Tag.TEST MARKED FOR Tag.IGNORE AND Tag.SOLO ${currentLocation}`);
        } else {
          isNextTokenSolo = true;
        }
        continue;
      } else if (this.isTag(line, Tag.IGNORE) && !this.isTag(line, Tag.TEST_IGNORE_PARAMS)) {
        isNextTokenIgnore = true;
        testSuite.hasIgnoredTests = true;
        continue;
      } else if (this.isTag(line, Tag.NODE_TEST)) {
        if (isTestSuite) {
          debug(`FOUND ` + Tag.NODE_TEST + ` AFTER '@TestSuite annotation - This test will subsequently !run as a node test. `);
          debug(`If you wish to run this suite of tests on a node, then make sure the ` + Tag.NODE_TEST + ` annotation appeares before the ` + Tag.TEST_SUITE + ` Annotation`);

          this.warnings.push(`FOUND ` + Tag.NODE_TEST + ` AFTER '@TestSuite annotation - This test will subsequently !run as a node test. ${currentLocation}`);
          this.warnings.push(`If you wish to run this suite of tests on a node, then make sure the ` + Tag.NODE_TEST + ` annotation appeares before the ` + Tag.TEST_SUITE + ` Annotation`);
        }
        nodeTestFileName = this.getTagText(line, Tag.NODE_TEST);
        isNextTokenNodeTest = true;
        continue;
      } else if (this.isTag(line, Tag.TEST)) {
        if (!isTestSuite) {
          debug(`FOUND ` + Tag.TEST + ` BEFORE '@TestSuite declaration - skipping test file! ` + currentLocation);
          this.warnings.push(`FOUND ` + Tag.TEST + ` BEFORE '@TestSuite declaration - skipping test file! ` + currentLocation);
          break;
        }
        if (!this.currentGroup) {
          debug(`FOUND ` + Tag.TEST + ` BEFORE '@It declaration - skipping test file!` + currentLocation);
          this.warnings.push(`FOUND ` + Tag.TEST + ` BEFORE '@It declaration - skipping test file!` + currentLocation);
          break;
        }
        this.reset();
        isNextTokenTest = true;
        nextName = this.getTagText(line, Tag.TEST);
        continue;
      } else if (this.isTag(line, Tag.SETUP)) {
        if (!isTestSuite) {
          debug(`FOUND ` + Tag.SETUP + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          this.errors.push(`FOUND ` + Tag.SETUP + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          break;
        }
        isNextTokenSetup = true;
        continue;
      } else if (this.isTag(line, Tag.TEAR_DOWN)) {
        if (!isTestSuite) {
          debug(`FOUND ` + Tag.TEAR_DOWN + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          this.errors.push(`FOUND ` + Tag.TEAR_DOWN + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          break;
        }
        isNextTokenTearDown = true;
        continue;
      } else if (this.isTag(line, Tag.BEFORE_EACH)) {
        if (!isTestSuite) {
          debug(`FOUND ` + Tag.BEFORE_EACH + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          this.errors.push(`FOUND ` + Tag.BEFORE_EACH + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          break;
        }
        isNextTokenBeforeEach = true;
        continue;
      } else if (this.isTag(line, Tag.AFTER_EACH)) {
        if (!isTestSuite) {
          debug(`FOUND ` + Tag.AFTER_EACH + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          this.errors.push(`FOUND ` + Tag.AFTER_EACH + ` BEFORE '@TestSuite declaration - skipping test file!` + currentLocation);
          break;
        }
        isNextTokenAfterEach = true;
        continue;
      } else if (line.match(this.assertInvocationRegex)) {
        if (!this.hasCurrentTestCase) {
          debug(`Found assert before test case was declared! ` + currentLocation);
          this.warnings.push(`Found assert before test case was declared! ` + currentLocation);
        } else {
          this.currentTestCases.forEach( (tc) => tc.addAssertLine(lineNumber));
        }
        continue;
      } else if (isNextTokenTest && line.match(this.functionEndRegex)) {
        this.reset();
        continue;
      } else if (this.isTag(line, Tag.TEST_IGNORE_PARAMS)) {
        isNextTokenTestCaseParam = true; //this keeps the processing going down to the function
        continue;
      } else if (this.isTag(line, Tag.TEST_PARAMS)) {
        if (!isNextTokenTest) {
          debug(`FOUND ` + Tag.TEST + ` PARAM WITHOUT @Test declaration ` + currentLocation);
          this.warnings.push(`FOUND ` + Tag.TEST + ` PARAM WITHOUT @Test declaration ` + currentLocation);
        } else {
          isNextTokenTestCaseParam = true;
          this.addParamsForLine(line, lineNumber, this.testCaseParamLines, this.testCaseParams, currentLocation);
        }
        continue;
      } else if (this.isTag(line, Tag.TEST_SOLO_PARAMS)) {
        if (!isNextTokenTest) {
          debug(`FOUND ` + Tag.TEST_SOLO_PARAMS + ` PARAM WITHOUT @Test declaration ` + currentLocation);
          this.warnings.push(`FOUND ` + Tag.TEST_SOLO_PARAMS + ` PARAM WITHOUT @Test declaration ` + currentLocation);
        } else {
          isNextTokenSolo = true;
          isNextTokenTestCaseParam = true;
          this.addParamsForLine(line, lineNumber, this.testCaseOnlyParamLines, this.testCaseOnlyParams, currentLocation);
        }
        continue;
      }

      if (isTokenItGroup || isNextTokenTest || isNextTokenSetup || isNextTokenBeforeEach || isNextTokenAfterEach || isNextTokenTearDown) {
        //have to find a function definition here - if it's !then this i {
        let functionName = this.getFunctionFromLine(line);
        if (functionName) {
          let numberOfExpectedParams = this.getNumberOfExpectedParamsFromLine(line);
          if (isNextTokenTest) {
            let testName = nextName || functionName;
            nodeTestFileName = nodeTestFileName || testSuite.nodeTestFileName;

            if (this.testCaseParams.length > 0 || this.testCaseOnlyParams.length > 0) {
              let paramsToUse = [];
              let paramLineNumbersToUse = [];
              if (this.testCaseOnlyParams.length > 0) {
                paramsToUse = this.testCaseOnlyParams;
                paramLineNumbersToUse = this.testCaseOnlyParamLines;
              } else {
                paramsToUse = this.testCaseParams;
                paramLineNumbersToUse = this.testCaseParamLines;
              }
              for (let index = 0; index < paramsToUse.length; index++) {
                let params = paramsToUse[index];

                let paramLineNumber = paramLineNumbersToUse[index];
                let testCase = new TestCase(testName, functionName, isNextTokenSolo, isNextTokenIgnore, lineNumber, params, index, paramLineNumber, numberOfExpectedParams);
                testCase.isParamTest = true;
                if (testCase) {
                  this.currentTestCases.push(testCase);
                } else {
                  debug(`Skipping unparseable params for testcase ` + params + ` @` + currentLocation);
                  this.warnings.push(`Skipping unparseable params for testcase ` + params + ` @` + currentLocation);
                }
              }
            } else {
              let testCase = new TestCase(testName, functionName, isNextTokenSolo, isNextTokenIgnore, lineNumber);
              testCase.expectedNumberOfParams = numberOfExpectedParams;
              this.currentTestCases.push(testCase);
            }
            if (this.currentGroup) {

              this.currentTestCases.forEach((aTestCase) => {
                this.currentGroup.addTestCase(aTestCase);
                if (aTestCase.isSolo) {
                  testSuite.hasSoloTests = true;
                }
              });
              this.hasCurrentTestCase = true;

              if (isNextTokenSolo) {
                this.currentGroup.hasSoloTests = true;
                testSuite.hasSoloTests = true;
                testSuite.isSolo = true;
              }
            } else {
              debug(`There is no currentGroup! - ignoring test`);
              this.warnings.push(`There is no currentGroup! - ignoring test ${currentLocation}`);
              continue;
            }

            isNextTokenSolo = false;
            isNextTokenIgnore = false;
            isNextTokenTestCaseParam = false;
            isNextTokenTest = false;
          } else if (isNextTokenSetup) {
            if (!this.currentGroup) {
              testSuite.setupFunctionName = functionName;
            } else {
              this.currentGroup.setupFunctionName = functionName;
            }
            isNextTokenSetup = false;
          } else if (isNextTokenTearDown) {
            if (!this.currentGroup) {
              testSuite.tearDownFunctionName = functionName;
            } else {
              this.currentGroup.tearDownFunctionName = functionName;
            }
            isNextTokenTearDown = false;
          } else if (isNextTokenBeforeEach) {
            if (!this.currentGroup) {
              testSuite.beforeEachFunctionName = functionName;
            } else {
              this.currentGroup.beforeEachFunctionName = functionName;
            }
            isNextTokenBeforeEach = false;
          } else if (isNextTokenAfterEach) {
            if (!this.currentGroup) {
              testSuite.afterEachFunctionName = functionName;
            } else {
              this.currentGroup.afterEachFunctionName = functionName;
            }
            isNextTokenAfterEach = false;
          } else {
            debug(` could !get function pointer for ` + functionName + ` ignoring`);
            this.errors.push(` could !get function pointer for ` + functionName + ` ignoring: ${currentLocation}`);
          }
        } else if (isNextTokenSetup) {
          debug(`could not find function directly after '@Setup - ignoring`);
          this.warnings.push(`could not find function directly after '@Setup - ignoring: ${currentLocation}`);
          isNextTokenSetup = false;
        } else if (isNextTokenTearDown) {
          debug(`could not find function directly after '@TearDown - ignoring`);
          this.warnings.push(`could not find function directly after '@TearDown - ignoring: ${currentLocation}`);
          isNextTokenTearDown = false;
        } else if (isNextTokenBeforeEach) {
          debug(`could not find function directly after '@BeforeEach - ignoring`);
          this.warnings.push(`could not find function directly after '@BeforeEach - ignoring: ${currentLocation}`);
          isNextTokenBeforeEach = false;
        } else if (isNextTokenAfterEach) {
          debug(`could not find function directly after '@AfterEach - ignoring`);
          this.warnings.push(`could not find function directly after '@AfterEach - ignoring: ${currentLocation}`);
          isNextTokenAfterEach = false;
        } else if (isNextTokenSetup) {
          debug(`could not find setup function - ignoring '@Setup`);
          this.warnings.push(`could not find setup function - ignoring '@Setup: ${currentLocation}`);
          isNextTokenSetup = false;
        } else if (isTokenItGroup) {
          isTokenItGroup = false;
          isNextTokenSolo = false;
          isNextTokenIgnore = false;
        }

        nodeTestFileName = ``;
        nextName = ``;
      }
    }
    // exitProcessing:
    this.testCaseOnlyParams = null;
    this.testCaseParams = null;
    this.currentTestCases = null;
    this.hasCurrentTestCase = null;

    if (!isTestSuite) {
      debug('Ignoring non test file ' + fileDescriptor.fullPath);
      this.errors.push('Ignoring non test file ' + fileDescriptor.fullPath);
    }
    return testSuite;
  }

  public getFunctionFromLine(line: string): any {
    let matches = line.match(this.functionNameRegex);
    return matches ? matches[2] : null;
  }

  public getNumberOfExpectedParamsFromLine(line: string): number {
    let matches = line.match(this.functionSignatureRegex);
    let text = matches ? matches[2] : null;
    return text ? text.split(',').length : 0;
  }

  public isTag(text: string, tag: Tag): boolean {
    return text.substring(0, tag.length).toUpperCase() === tag.toUpperCase();
  }

  public getTagText(text: string, tag: Tag): string {
    return text.substr(tag.length).trim();
  }

  public reset() {
    this.testCaseOnlyParams = [];
    this.testCaseParams = [];
    this.testCaseParamLines = [];
    this.testCaseOnlyParamLines = [];
    this.currentTestCases = [];

    ' we can have multiple test cases based on our para';
    this.hasCurrentTestCase = false;
  }

  public addParamsForLine(line: string, lineNumber: number, targetParamLinesArray: number[], targetParamsArray: object[], currentLocation: string) {
    let rawParams = this.getTagText(line, Tag.TEST_PARAMS);
    try {
      let jsonParams = JSON.parse(rawParams);
      targetParamsArray.push(jsonParams);
      targetParamLinesArray.push(lineNumber);
    } catch (e) {
      this.errors.push(`illegal params found at ${currentLocation}. Not adding test - params were : ${line}`);
    }
  }
}
