import { BrsFile, CommentStatement, Statement, Token, Expression, AnnotationExpression } from 'brighterscript';
import { diagnosticDuplicateSuite, diagnosticIllegalParams, diagnosticNoTestFunctionDefined as diagnosticMultipleTestOnFunctionDefined } from '../utils/Diagnostics';

declare type ExpressionValue = string | number | boolean | Expression | ExpressionValue[] | {
  [key: string]: ExpressionValue;
};

export enum AnnotationType {
  None,
  TestSuite = 'testsuite',
  It = 'it',
  Group = 'testgroup',
  Ignore = 'ignore',
  Solo = 'only',
  Test = 'test',
  NodeTest = 'sgnode',
  Setup = 'setup',
  TearDown = 'teardown',
  BeforeEach = 'beforeeach',
  AfterEach = 'aftereach',
  Params = 'params',
  IgnoreParams = 'ignoreparams',
  SoloParams = 'onlyparams'
}

let annotationLookup = {
  testsuite: AnnotationType.TestSuite,
  it: AnnotationType.It,
  testgroup: AnnotationType.Group,
  ignore: AnnotationType.Ignore,
  only: AnnotationType.Solo,
  test: AnnotationType.Test,
  sgnode: AnnotationType.NodeTest,
  setup: AnnotationType.Setup,
  teardown: AnnotationType.TearDown,
  beforeeach: AnnotationType.BeforeEach,
  aftereach: AnnotationType.AfterEach,
  params: AnnotationType.Params,
  ignoreparams: AnnotationType.IgnoreParams,
  onlyparams: AnnotationType.SoloParams
};

interface ParsedComment {
  blockAnnotation?: RooibosAnnotation;
  testAnnotation?: RooibosAnnotation;
}

export class AnnotationParams {

  constructor(
    public annotation: AnnotationExpression,
    public text: string,
    public lineNumber: number,
    public params: object[],
    public isIgnore = false,
    public isSolo = false
  ) {

  }
}
export class RooibosAnnotation {
  /**
   * Represents a group of comments which contain tags such as @only, @testsuite, @testcase, @testgroup etc
   * @param statement block of comments that contain annotations to apply to the next statement
   */
  constructor(
    public file: BrsFile,
    public annotation: AnnotationExpression,
    public annotationType: AnnotationType,
    public text: string,
    public name: string,
    public isIgnore = false,
    public isSolo = false,
    public params: AnnotationParams[] = [],
    public nodeName?: string
  ) {

  }

  public hasSoloParams = false;

  public static getAnnotation(file: BrsFile, statement: Statement): ParsedComment | null {

    //split annotations in case they include an it group..
    let blockAnnotation: RooibosAnnotation;
    let testAnnotation: RooibosAnnotation;
    let isSolo = false;
    let isIgnore = false;
    let nodeName = null;
    if (statement.annotations?.length) {
      for (let annotation of statement.annotations) {
        const annotationType = getAnnotationType(annotation.name);
        switch (annotationType) {

          case AnnotationType.None:
          default:
            continue;
          case AnnotationType.Solo:
            isSolo = true;
            break;
          case AnnotationType.NodeTest:
            nodeName = annotation.getArguments()[0] as string;
            break;
          case AnnotationType.Ignore:
            isIgnore = true;
            break;
          case AnnotationType.It:
          case AnnotationType.Group:
          case AnnotationType.TestSuite:
            const groupName = annotation.getArguments()[0] as string;
            blockAnnotation = new RooibosAnnotation(file, annotation, annotationType, annotation.name, groupName, isIgnore, isSolo, null, nodeName);
            nodeName = null;
            isSolo = false;
            isIgnore = false;
            break;
          case AnnotationType.Test:
            const testName = annotation.getArguments()[0] as string;
            let newAnnotation = new RooibosAnnotation(file, annotation, annotationType, annotation.name, testName, isIgnore, isSolo);
            if (testAnnotation) {
              diagnosticMultipleTestOnFunctionDefined(file, newAnnotation);
            } else {
              testAnnotation = newAnnotation;
            }
            isSolo = false;
            isIgnore = false;
            break;
          case AnnotationType.Params:
          case AnnotationType.SoloParams:
          case AnnotationType.IgnoreParams:
            if (testAnnotation) {
              testAnnotation.parseParams(file, annotation, annotation.name, annotationType);
            } else {
              //error
            }
            break;
        }
      }
    }
    return { blockAnnotation: blockAnnotation, testAnnotation: testAnnotation };
  }

  public parseParams(file: BrsFile, annotation: AnnotationExpression, text: string, annotationType: AnnotationType) {
    let rawParams = JSON.stringify(annotation.getArguments());
    let isSolo = annotationType === AnnotationType.SoloParams;
    let isIgnore = annotationType === AnnotationType.IgnoreParams;
    if (isSolo) {
      this.hasSoloParams = true;
    }
    try {
      if (rawParams) {
        this.params.push(new AnnotationParams(annotation, rawParams, annotation.range.start.line, annotation.getArguments() as any, isIgnore, isSolo));
      } else {
        diagnosticIllegalParams(file, annotation);
      }
    } catch (e) {
      diagnosticIllegalParams(file, annotation);
    }
  }

}

function getAnnotationType(text: string): AnnotationType {
  return annotationLookup[text.toLowerCase()] || AnnotationType.None;
}

function getAnnotationText(text: string, annotationType: AnnotationType): string {
  const regexp = new RegExp(`^\s*'@${annotationType}\s*(.*)`, 'i');
  const matches = regexp.exec(text);
  return matches && matches.length === 2 ? matches[1] : '';
}

function getJsonFromString(text) {
  let value = null;
  // eslint-disable-next-line no-eval
  eval('value = ' + text);
  return value;
}
