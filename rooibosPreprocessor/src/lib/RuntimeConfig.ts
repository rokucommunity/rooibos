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
    this._functionMap = functionMap;
    this._excludeMatcher = new Minimatch(`rooibos.cat.brs`);
  }

  private readonly _warnings: string[];
  private readonly _errors: string[];
  private _excludeMatcher: M.IMinimatch;
  private _testSuites: TestSuite[];
  private _hasSoloSuites: boolean;
  private _hasSoloGroups: boolean;
  private _hasSoloTests: boolean;
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
    this.errors.concat(testSuiteBuilder.errors);
    this.warnings.concat(testSuiteBuilder.warnings);
  }

  public createTestSuiteLookupFunction(): string {
    let text = `
    function RBSFM_getTestSuitesForProject()
        return [
        `;

    this.testSuites.forEach((testSuite) => {
      text += `\n${JSON.stringify(testSuite.asJson(), null, 2)},\n`;
    });
    text += `
      ]
    end function\n`;
    return text;
  }
}
