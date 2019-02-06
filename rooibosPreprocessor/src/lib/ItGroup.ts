import { TestCase } from './TestCase';

export class ItGroup {
  constructor(name: string, isSolo: boolean, isIgnore: boolean, filename: string) {
    this.name = name;
    this.isSolo = isSolo;
    this.hasSoloTests = false;
    this.isIncluded = false;
    this.isIgnored = isIgnore;
    this.filename = filename;
    this.testCases = [];
    this.ignoredTestCases = [];
    this.soloTestCases = [];
  }

  public isIncluded: boolean;
  public isSolo: boolean;
  public isIgnored: boolean;
  public filename: string;
  public name: string;

  public testCases: TestCase[];
  public ignoredTestCases: TestCase[];
  public soloTestCases: TestCase[];
  public setupFunctionName: string;
  public tearDownFunctionName: string;
  public beforeEachFunctionName: string;
  public afterEachFunctionName: string;
  public hasSoloTests: boolean;

  public asJson(): object {
    return {
      testCases: this.testCases.filter( (testCase) => testCase.isIncluded)
        .map((testCase) => testCase.asJson()),
      ignoredTestCases: this.ignoredTestCases.filter( (testCase) => testCase.isIncluded)
        .map((testCase) => testCase.asJson()),
      soloTestCases: this.soloTestCases.filter( (testCase) => testCase.isIncluded)
        .map((testCase) => testCase.asJson()),
      filename: this.filename,
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

  public asText(): string {
    let testCases = this.testCases.filter( (testCase) => testCase.isIncluded)
      .map((testCase) => testCase.asText());
    let ignoredTestCases = this.ignoredTestCases.filter( (testCase) => testCase.isIncluded)
      .map((testCase) => testCase.asText());
    let soloTestCases = this.soloTestCases.filter( (testCase) => testCase.isIncluded)
      .map((testCase) => testCase.asText());
    return `
      {
        testCases: [${testCases}]
        ignoredTestCases: [${ignoredTestCases}]
        soloTestCases: [${soloTestCases}]
        filename: "${this.filename}"
        setupFunctionName: "${this.setupFunctionName || ''}"
        tearDownFunctionName: "${this.tearDownFunctionName || ''}"
        beforeEachFunctionName: "${this.beforeEachFunctionName || ''}"
        afterEachFunctionName: "${this.afterEachFunctionName || ''}"
        isSolo: ${this.isSolo}
        isIgnored: ${this.isIgnored}
        hasSoloTests: ${this.hasSoloTests}
        name: "${this.name || ''}"
      }`;
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
