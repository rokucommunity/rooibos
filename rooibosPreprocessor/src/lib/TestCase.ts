export class TestCase {
  constructor(name: string, funcName: string, isSolo: boolean, isIgnored: boolean, lineNumber: number, params?: string, paramTestIndex: number = 0, paramLineNumber: number = 0) {

    this.isSolo = isSolo;
    this.funcName = funcName;
    this.isIgnored = isIgnored;
    this.name = name;
    this.lineNumber = lineNumber;
    this.paramLineNumber = paramLineNumber;
    this.assertIndex = 0;
    this.assertLineNumberMap = {};
    this.rawParams = params || '';
    this.paramTestIndex = paramTestIndex;
    this.isParamTest = false;

    if (params) {
      this.name += this.paramTestIndex.toString().trim();
    }
  }

  public isSolo: boolean;
  public funcName: string;
  public isIgnored: boolean;
  public isParamTest: boolean;
  public name: string;
  public lineNumber: number;
  public paramLineNumber: number;
  public assertIndex: number;
  public assertLineNumberMap: object;
  public rawParams: string;
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
      rawParams: this.rawParams,
      paramTestIndex: this.paramTestIndex,
    };
  }

  public addAssertLine(lineNumber: number) {
    this.assertLineNumberMap[this.assertIndex.toString().trim()] = lineNumber;
    this.assertIndex++;
  }

}
