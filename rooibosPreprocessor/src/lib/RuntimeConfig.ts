import * as Debug from 'debug';
import * as fs from 'fs-extra';
import * as M from 'minimatch';
import { Minimatch } from 'minimatch';
import * as path from 'path';

import FileDescriptor from './FileDescriptor';
import FunctionMap from './FunctionMap';
import { TestSuite } from './TestSuite';
import { TestSuiteBuilder } from './TestSuiteBuilder';

const debug = Debug('RooibosProcessor');

export class RuntimeConfig {

  constructor(functionMap: FunctionMap) {
    this._testSuites = [];
    this._warnings = [];
    this._errors = [];
    this.ignoredTestNames = [];
    this._functionMap = functionMap;
    this._excludeMatcher = new Minimatch(`rooibos.cat.brs`);
  }

  private ignoredCount: number = 0;
  private ignoredTestNames: string[];
  private readonly _warnings: string[];
  private readonly _errors: string[];
  private _excludeMatcher: M.IMinimatch;
  private _testSuites: TestSuite[];
  private _hasSoloSuites: boolean = false;
  private _hasSoloGroups: boolean = false;
  private _hasSoloTests: boolean = false;
  private _functionMap: FunctionMap;

  get testSuites(): TestSuite[] {
    return this._testSuites;
  }

  public get errors(): string[] {
    return this._errors;
  }

  public get warnings(): string[] {
    return this._warnings;
  }

  /**
   * Process all of the tests files in the given folder,
   * Create TestSuites, and functionMaps
   * @function processSourceFolder
   * @param directory
   */
  public processPath(directory: string, rootPath?: string) {
    debug(`processing files at path ${directory} `);
    //TODO - make async.
    //TODO - cachetimestamps for files - for performance
    let testSuiteBuilder = new TestSuiteBuilder(50);
    fs.readdirSync(directory).forEach((filename) => {
      const fullPath = path.join(directory, filename);
      if (fs.statSync(fullPath).isDirectory()) {
        this.processPath(fullPath);
      } else {
        const extension = path.extname(filename).toLowerCase();
        if (extension === '.brs') {
          if (!this._excludeMatcher.match(directory)) {
            const fileDescriptor = new FileDescriptor(directory, filename, path.extname(filename));
            this._functionMap.processFile(fileDescriptor);
            let testSuite = testSuiteBuilder.processFile(fileDescriptor, rootPath);
            if (testSuite.isValid) {
              this.testSuites.push(testSuite);
              if (testSuite.isSolo) {
                this._hasSoloSuites = true;
              }
              if (testSuite.hasSoloTests) {
                this._hasSoloTests = true;
              }
              if (testSuite.hasSoloGroups) {
                this._hasSoloGroups = true;
              }
            } else {
              debug(`ignoring invalid suite`);
            }
          } else {
            this._warnings.push(`skipping excluded path ${directory}`);
          }
        }
      }
    });

    this.updateIncludedFlags();

    this.errors.concat(testSuiteBuilder.errors);
    this.warnings.concat(testSuiteBuilder.warnings);
  }

  public createTestSuiteLookupFunction(): string {
    let text = `
    function RBSFM_getTestSuitesForProject()
        return [
        `;
    this.testSuites.forEach((testSuite) => {
      if (testSuite.isIncluded) {
        text += `\n${testSuite.asText()},\n`;
      }
    });
    text += `
      ]
    end function\n`;
    return text;
  }

  /**
   * Once we know what's ignored/solo/etc, we can ascertain if we're going
   * to include it in the final json payload
   */
  private updateIncludedFlags() {
    this.testSuites.forEach( (testSuite) => {
      if (this._hasSoloTests && !testSuite.hasSoloTests) {
        testSuite.isIncluded = false;
      } else if (this._hasSoloSuites && !testSuite.isSolo) {
        testSuite.isIncluded = false;
      } else if (testSuite.isIgnored) {
        testSuite.isIncluded = false;
        this.ignoredTestNames.push('|-' + testSuite.name + ' [WHOLE SUITE]');
        this.ignoredCount++;
      } else {
        testSuite.isIncluded = true;
      }
      // console.log('testSuite  ' + testSuite.name);
      testSuite.itGroups.forEach( (itGroup) => {
        // console.log('GROUP  ' + itGroup.name);
        if (itGroup.isIgnored) {
          this.ignoredCount += itGroup.testCases.length;
          this.ignoredTestNames.push('  |-' + itGroup.name + ' [WHOLE GROUP]');
        } else {
          if (itGroup.ignoredTestCases.length > 0) {
            this.ignoredTestNames.push('  |-' + itGroup.name);
            this.ignoredCount += itGroup.ignoredTestCases.length;
            itGroup.ignoredTestCases.forEach((ignoredTestCase) => {
              if (!ignoredTestCase.isParamTest) {
                this.ignoredTestNames.push('  | |--' + ignoredTestCase.name);
              } else if (ignoredTestCase.paramTestIndex === 0) {
                let testCaseName = ignoredTestCase.name;
                if (testCaseName.length > 1 && testCaseName.substr(testCaseName.length - 1) === '0') {
                  testCaseName = testCaseName.substr(0, testCaseName.length - 1);
                }
                this.ignoredTestNames.push('  | |--' + testCaseName);
              }
            });
          }
          if (this._hasSoloTests && !itGroup.hasSoloTests && !itGroup.isSolo) {
            itGroup.isIncluded = false;
          } else if (itGroup.testCases.length === 0 && itGroup.soloTestCases.length === 0) {
            itGroup.isIncluded = false;
          } else {
            itGroup.isIncluded = testSuite.isIncluded;
          }
          itGroup.testCases.forEach( (testCase) => {
            // console.log(testCase.name + ' this._hasSoloTests ' + this._hasSoloTests + ' testCase.isSolo ' + testCase.isSolo);
            if (this._hasSoloTests && !testCase.isSolo) {
              testCase.isIncluded = false;
            } else {
              testCase.isIncluded = itGroup.isIncluded || testCase.isSolo;
            }
          });
          itGroup.soloTestCases.forEach( (testCase) => {
            // console.log(testCase.name + ' this._hasSoloTests ' + this._hasSoloTests + ' testCase.isSolo ' + testCase.isSolo);
            testCase.isIncluded = true;
          });
        }
      });
    });
  }

  public asJson(): object[] {
    return this.testSuites.filter( (testSuite) => testSuite.isIncluded)
      .map((testSuite) => testSuite.asJson());
  }
}
