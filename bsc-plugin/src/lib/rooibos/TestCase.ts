import { RooibosAnnotation } from './Annotation';
import { sanitizeBsJsonString } from './Utils';

export class TestCase {
  constructor(annotation: RooibosAnnotation, name: string, funcName: string, isSolo: boolean, isIgnored: boolean, lineNumber: number,
    params: any[] = null, paramTestIndex = 0, paramLineNumber = 0, expectedNumberOfParams = 0) {
    this.annotation = annotation;
    this.isSolo = isSolo;
    this.funcName = funcName;
    this.isIgnored = isIgnored;
    this.name = name;
    this.lineNumber = lineNumber;
    this.paramLineNumber = paramLineNumber;
    this.assertIndex = 0;
    this.assertLineNumberMap = {};
    this.rawParams = params;
    this.expectedNumberOfParams = expectedNumberOfParams;
    this.paramTestIndex = paramTestIndex;
    this.isParamTest = this.expectedNumberOfParams > 0;

  }

  public annotation: RooibosAnnotation;
  public isIncluded: boolean;
  public isSolo: boolean;
  public funcName: string;
  public isIgnored: boolean;
  public isParamTest: boolean;
  public name: string;
  public lineNumber: number;
  public paramLineNumber: number;
  public assertIndex: number;
  public expectedNumberOfParams: number;
  public assertLineNumberMap: object;
  public rawParams: any[];
  public paramTestIndex: number;

  public asJson(): object {
    return {
      isSolo: this.isSolo,
      funcName: this.funcName,
      isIgnored: this.isIgnored,
      isParamTest: this.isParamTest,
      name: this.name,
      lineNumber: this.lineNumber,
      paramLineNumber: this.paramLineNumber,
      assertIndex: this.assertIndex,
      assertLineNumberMap: this.assertLineNumberMap,
      rawParams: this.rawParams ? JSON.stringify(this.rawParams).replace(/null/g, 'invalid') : '',
      paramTestIndex: this.paramTestIndex,
      expectedNumberOfParams: this.expectedNumberOfParams,
      isParamsValid: (this.rawParams || []).length === this.expectedNumberOfParams
    };
  }

  public asText(): string {
    return `
        {
          isSolo: ${this.isSolo}
          funcName: "${this.funcName || ''}"
          isIgnored: ${this.isIgnored}
          isParamTest: ${this.isParamTest}
          name: ${sanitizeBsJsonString(this.name)}
          lineNumber: ${this.lineNumber}
          paramLineNumber: ${this.paramLineNumber}
          assertIndex: ${this.assertIndex}
          assertLineNumberMap: ${JSON.stringify(this.assertLineNumberMap)}
          rawParams: ${this.rawParams ? JSON.stringify(this.rawParams).replace(/null/g, 'invalid') : '[]'}
          paramTestIndex: ${this.paramTestIndex}
          expectedNumberOfParams: ${this.expectedNumberOfParams}
          isParamsValid: ${(this.rawParams || []).length === this.expectedNumberOfParams}
        }`;
  }

  public addAssertLine(lineNumber: number) {
    this.assertLineNumberMap[this.assertIndex.toString().trim()] = lineNumber;
    this.assertIndex++;
  }

}
