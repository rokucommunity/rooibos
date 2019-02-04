import { TestCase } from './TestCase';

export class ItGroup {
  constructor(name: string, isSolo: boolean, isIgnore: boolean, filename: string) {
    this.name = name;
    this.isSolo = isSolo;
    this.isIgnored = isIgnore;
    this.filename = filename;
    this.testCases = [];
    this.ignoredTestCases = [];
    this.soloTestCases = [];
  }

  public isSolo: boolean;
  public isIgnored: boolean;
  public filename: string;
  public name: string;

  public testCases: TestCase[];
  public ignoredTestCases: TestCase[];
  public soloTestCases: TestCase[];
  public testCaseLookup: boolean;
  public setupFunctionName: string;
  public tearDownFunctionName: string;
  public beforeEachFunctionName: string;
  public afterEachFunctionName: string;
  public hasSoloTests: boolean;

  public asJson(): object {
    return {
      testCases: this.testCases.map((testCase) => testCase.asJson()),
      ignoredTestCases: this.ignoredTestCases.map((testCase) => testCase.asJson()),
      soloTestCases: this.soloTestCases.map((testCase) => testCase.asJson()),
      filename: this.filename,
      testCaseLookup: this.testCaseLookup,
      setupFunctionName: this.setupFunctionName,
      tearDownFunctionName: this.tearDownFunctionName,
      beforeEachFunctionName: this.beforeEachFunctionName,
      afterEachFunctionName: this.afterEachFunctionName,
      isSolo: this.isSolo,
      isIgnored: this.isIgnored,
      hasSoloTests: this.hasSoloTests,
      name: this.name
    };
  }
  public addTestCase(testCase: TestCase) {
    if (testCase.isSolo) {
      this.soloTestCases.push(testCase);
      this.hasSoloTests = true;
    } else if (testCase.isIgnored) {
      this.ignoredTestCases.push(testCase);
    } else {
      this.testCases.push(testCase);
    }
  }

}
