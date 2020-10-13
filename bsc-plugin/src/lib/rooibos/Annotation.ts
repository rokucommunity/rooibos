import { BrsFile, CommentStatement, Token } from 'brighterscript'
import { diagnosticDuplicateSuite, diagnosticIllegalParams } from '../utils/Diagnostics';

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
  onlyparam: AnnotationType.SoloParams,
};

interface ParsedComment {
  blockAnnotation?: Annotation;
  testAnnotation?: Annotation;
}

export class AnnotationParams {

  constructor(
    public token: Token,
    public text: string,
    public lineNumber: number,
    public params: object[],
    public isIgnore: boolean = false,
    public isSolo: boolean = false
  ) {

  }
}
export class Annotation {
  /**
   * Represents a group of comments which contain tags such as @only, @testsuite, @testcase, @testgroup etc
   * @param statement block of comments that contain annotations to apply to the next statement
   */
  constructor(
    public file: BrsFile,
    public token: Token,
    public annotationType: AnnotationType,
    public text: string,
    public name: string,
    public isIgnore: boolean = false,
    public isSolo: boolean = false,
    public params: AnnotationParams[] = [],
    public nodeName?: string
  ) {

  }

  public static parseCommentStatement(file: BrsFile, statement: CommentStatement): ParsedComment | null {

    //split annotations in case they include an it group..
    let blockAnnotation: Annotation;
    let testAnnotation: Annotation;
    let isSolo = false;
    let isIgnore = false;
    let nodeName = null;

    for (let comment of statement.comments) {
      const text = comment.text;
      const annotationType = getAnnotationType(text);
      switch (annotationType) {

        case AnnotationType.None:
          continue;
          break;
        case AnnotationType.Solo:
          isSolo = true;
          break;
        case AnnotationType.NodeTest:
          nodeName = getAnnotationText(text, annotationType);
          break;
        case AnnotationType.Ignore:
          isIgnore = true;
          break;
        case AnnotationType.It:
        case AnnotationType.Group:
        case AnnotationType.TestSuite:
          const groupName = getAnnotationText(text, annotationType);
          blockAnnotation = new Annotation(file, comment, annotationType, text, groupName, isIgnore, isSolo,null, nodeName);
          nodeName = null;
          isSolo = false;
          isIgnore = false;
          break;
        case AnnotationType.Test:
          const testName = getAnnotationText(text, annotationType);
          testAnnotation = new Annotation(file, comment, annotationType, text, testName, isIgnore, isSolo);
          isSolo = false;
          isIgnore = false;
          break;
        case AnnotationType.Params:
        case AnnotationType.SoloParams:
        case AnnotationType.IgnoreParams:
          if (testAnnotation) {
            testAnnotation.parseParams(file, comment, text, annotationType);
          } else {
            //error
          }
          break;
      }
    }
    return { blockAnnotation: blockAnnotation, testAnnotation: testAnnotation };
  }

  public parseParams(file: BrsFile, comment: Token, text: string, annotationType: AnnotationType) {
    let rawParams = getAnnotationText(text, annotationType);
    let isSolo = annotationType === AnnotationType.SoloParams;
    let isIgnore = annotationType === AnnotationType.IgnoreParams;
    try {
      const paramsInvalidToNullRegex = /(,|\:|\[)(\s*)(invalid)/g;
      let jsonText = rawParams.replace(paramsInvalidToNullRegex, '$1$2null');
      let jsonParams = getJsonFromString(jsonText);
      if (jsonParams) {
        this.params.push(new AnnotationParams(comment, jsonText, comment.range.start.line, jsonParams, isIgnore, isSolo));
      } else {
        diagnosticIllegalParams(file, comment);
      }
    } catch (e) {
      diagnosticIllegalParams(file, comment);
    }
  }

}

function getAnnotationType(text: string): AnnotationType {
  const regexp = new RegExp(`^\\s*'@([a-z]*)`, 'i');
  const matches = text.match(regexp);
  const tag = matches && matches.length > 0 ? matches[1].toLowerCase() : null;

  return annotationLookup[tag] || AnnotationType.None;
}

function getAnnotationText(text: string, annotationType: AnnotationType): string {
  const regexp = new RegExp(`^\\s*'@${annotationType}\\s*(.*)`, 'i');
  const matches = text.match(regexp);
  return matches && matches.length === 2 ? matches[1] : '';
}

function getJsonFromString(text) {
  let value = null;
  // tslint:disable-next-line:no-eval
  eval('value = ' + text);
  return value;
}
