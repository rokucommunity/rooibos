import { DottedGetExpression, createVisitor, WalkMode, CallExpression, createIntegerLiteral, Position, LiteralExpression, isCallfuncExpression, isDottedGetExpression, isCallExpression } from 'brighterscript';
import { Int32 } from 'brighterscript/dist/brsTypes';
import { TranspileState } from 'brighterscript/dist/parser/TranspileState';
import { diagnosticErrorProcessingFile } from '../utils/Diagnostics';
import { RooibosAnnotation } from './Annotation';
import { RawCodeStatement } from './RawCodeStatement';
import { getSessionInfo } from './RooibosSessionInfo';
import { TestCase } from './TestCase';
import { TestBlock, TestSuite } from './TestSuite';
import { sanitizeBsJsonString } from './Utils';

export class TestGroup extends TestBlock {

  constructor(testSuite: TestSuite, annotation: RooibosAnnotation) {
    super(annotation);
    this.testSuite = testSuite;
    this.setupFunctionName = this.setupFunctionName || this.testSuite.setupFunctionName;
    this.tearDownFunctionName = this.tearDownFunctionName || this.testSuite.tearDownFunctionName;
    this.beforeEachFunctionName = this.beforeEachFunctionName || this.testSuite.beforeEachFunctionName;
    this.afterEachFunctionName = this.afterEachFunctionName || this.testSuite.afterEachFunctionName;
  }

  public testSuite: TestSuite;
  public testCases = new Map<string, TestCase>();
  public ignoredTestCases: TestCase[] = [];
  public soloTestCases: TestCase[] = [];

  public addTestCase(testCase: TestCase) {

    this.testCases.set(testCase.name + (testCase.isParamTest ? testCase.paramTestIndex.toString() : ''), testCase);

    if (testCase.isIgnored) {
      this.ignoredTestCases.push(testCase);
      this.hasIgnoredTests = true;
    } else if (testCase.isSolo) {
      this.hasSoloTests = true;
      this.soloTestCases.push(testCase);
    }
  }

  public getTestCases(): TestCase[] {
    return [...this.testCases.values()];
  }

  public modifyAssertions(testCase: TestCase) {
    //for each method
    //if assertion
    //wrap with if is not fail
    //add line number as last param
    const transpileState = new TranspileState(this.file);
    try {
      let func = this.testSuite.classStatement.memberMap[testCase.funcName.toLowerCase()];
      func.walk(createVisitor({
        ExpressionStatement: (es) => {
          let ce = es.expression as CallExpression;
          if (isCallExpression(ce) && isDottedGetExpression(ce.callee)) {
            let dge = ce.callee;
            let assertRegex = /(?:fail|assert(?:[a-z0-9]*)|expect(?:[a-z0-9]*))/i;
            if (dge && assertRegex.test(dge.name.text)) {
              return new RawCodeStatement(`
    if not m.currentResult.isFail
      m.currentAssertLineNumber = ${ce.range.start.line}
      ${ce.transpile(transpileState).join('')}
    end if`);
            }
          }
        }
      }), {
        walkMode: WalkMode.visitStatementsRecursive
      });
    } catch (e) {
      // console.log(e);
      diagnosticErrorProcessingFile(this.testSuite.file, e.message);
    }
  }

  public asJson(): object {
    return {
      pkgPath: this.pkgPath,
      setupFunctionName: this.setupFunctionName,
      tearDownFunctionName: this.tearDownFunctionName,
      beforeEachFunctionName: this.beforeEachFunctionName,
      afterEachFunctionName: this.afterEachFunctionName,
      isSolo: this.isSolo,
      isIgnored: this.isIgnored,
      name: this.name
    };
  }

  public asText(): string {
    let testCaseText = [...this.testCases.values()].filter((tc) => tc.isIncluded).map((tc) => tc.asText());

    return `
      {
        name: ${sanitizeBsJsonString(this.name)}
        isSolo: ${this.isSolo}
        isIgnored: ${this.isIgnored}
        filename: "${this.pkgPath}"
        setupFunctionName: "${this.setupFunctionName || ''}"
        tearDownFunctionName: "${this.tearDownFunctionName || ''}"
        beforeEachFunctionName: "${this.beforeEachFunctionName || ''}"
        afterEachFunctionName: "${this.afterEachFunctionName || ''}"
        testCases: [${testCaseText.join(',\n')}]
      }`;
  }

}
