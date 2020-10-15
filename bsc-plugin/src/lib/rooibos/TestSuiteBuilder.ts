
import {
  BrsFile,
  ClassMethodStatement,
  ClassStatement,
  CommentStatement,
  createVisitor,
  FunctionStatement,
  isClassMethodStatement,
  isClassStatement,
  isCommentStatement,
  isFunctionStatement,
  NamespaceStatement,
  ParseMode,
  WalkMode,
  WalkOptions
} from 'brighterscript';

import { TestGroup } from './TestGroup';

import { Annotation, AnnotationType } from './Annotation';

import { TestCase } from './TestCase';
import { TestSuite } from './TestSuite';

import {
  diagnosticDuplicateSuite,
  diagnosticErrorProcessingFile,
  diagnosticGroupWithNameAlreadyDefined,
  diagnosticIncompatibleAnnotation,
  diagnosticNoGroup,
  diagnosticTestWithNameAlreadyDefined,
  diagnosticWrongAnnotation,
  diagnosticWrongParameterCount,
  diagnosticWrongTestParameterCount
} from '../utils/Diagnostics';
import { RooibosSession } from './RooibosSession';

export class TestSuiteBuilder {
  constructor(public session: RooibosSession) {
  }

  //state
  private currentGroup?: TestGroup;
  private annotation?: Annotation;
  private testSuite: TestSuite;
  private file: BrsFile;

  public processFile(file: BrsFile): TestSuite[] {
    this.file = file;
    let suites = [];
    try {

      file.ast.walk(createVisitor({
        NamespaceStatement: (ns) => {

          //a test is comprised of a comment block; followed by a class
          let annotation: Annotation;
          for (let s of ns.body.statements) {
            if (isClassStatement(s)) {
              if (annotation) {
                if (annotation.annotationType === AnnotationType.TestSuite) {
                  this.addSuiteIfValid(file, annotation, s, suites);
                } else {
                  diagnosticWrongAnnotation(file, s, 'Expected a TestSuite annotation, got: ' + annotation.annotationType);
                  throw new Error('bad test suite');
                }
              }
              annotation = null; //clear out old annotation
            } else if (isCommentStatement(s)) {
              let { blockAnnotation } = Annotation.parseCommentStatement(file, s);
              annotation = blockAnnotation;
            }
          }
        }
      }), {
        walkMode: WalkMode.visitStatements
      });
    } catch (e) {
      console.log(e);
      diagnosticErrorProcessingFile(file, e.message);
    }
    this.session.sessionInfo.updateTestSuites(suites);
    return suites;
  }

  public addSuiteIfValid(file: BrsFile, annotation: Annotation, s: ClassStatement, suites: TestSuite[]) {
    let oldSuite = this.session.sessionInfo.testSuites.get(annotation.name);
    let suite = this.processClass(annotation, s);
    if ((oldSuite && oldSuite.file.pathAbsolute !==
      file.pathAbsolute)) {
      oldSuite.isValid = false;
      suite.isValid = false;
      diagnosticDuplicateSuite(file, oldSuite.classStatement, oldSuite.annotation);
    }

    let duplicateSuites = suites.filter((s) => s.name === suite.name);
    if (duplicateSuites.length > 0) {
      for (let duplicateSuite of duplicateSuites) {
        duplicateSuite.isValid = false;
        diagnosticDuplicateSuite(file, duplicateSuite.classStatement, duplicateSuite.annotation);
      }
      suite.isValid = false;
    }

    suites.push(suite);
    if (!suite.isValid) {
      diagnosticDuplicateSuite(file, suite.classStatement, suite.annotation);
    }
  }

  public processClass(annotation: Annotation, classStatement: ClassStatement): TestSuite {
    this.testSuite = new TestSuite(annotation, classStatement);
    this.currentGroup = null;
    this.annotation = null;

    for (let s of classStatement.body) {
      if (isClassMethodStatement(s)) {
        this.processClassMethod(s);
        this.annotation = null;
      } else if (isCommentStatement(s)) {
        let { blockAnnotation, testAnnotation } = Annotation.parseCommentStatement(this.file, s);
        if (blockAnnotation) {
          if (this.annotation) {
            diagnosticNoGroup(this.file, s);
          }
          if (this.currentGroup) {
            this.testSuite.addGroup(this.currentGroup);
          }
          if (!this.createGroup(blockAnnotation)) {
            this.currentGroup = null;
            break;
          }
        }
        if (this.isAllowedAnnotation(testAnnotation)) {
          this.annotation = testAnnotation;
        } else {
          diagnosticIncompatibleAnnotation(this.annotation);
        }

      }
    }

    if (this.currentGroup) {
      this.testSuite.addGroup(this.currentGroup);
    }
    this.testSuite.isValid = this.testSuite.file.getDiagnostics().length === 0;
    return this.testSuite;
  }

  public isAllowedAnnotation(annotation: Annotation): boolean {
    switch (this.annotation ? this.annotation.annotationType : AnnotationType.None) {
      case AnnotationType.None:
      default:
        return true;
      case AnnotationType.TestSuite:
      case AnnotationType.Setup:
      case AnnotationType.TearDown:
      case AnnotationType.BeforeEach:
      case AnnotationType.AfterEach:
        return false;
    }
  }
  public createGroup(blockAnnotation: Annotation): boolean {
    if (!this.testSuite.testGroups.has(blockAnnotation.name)) {
      this.currentGroup = new TestGroup(this.testSuite, blockAnnotation);
      return true;
    } else {
      diagnosticGroupWithNameAlreadyDefined(this.file, blockAnnotation);
      return false;
    }
  }

  public processClassMethod(statement: ClassMethodStatement) {
    let block = this.currentGroup ?? this.testSuite;

    if (this.annotation) {
      switch (this.annotation.annotationType) {
        case AnnotationType.Test:
          if (!this.currentGroup) {
            diagnosticNoGroup(this.file, statement);
          } else {
            this.createTestCases(statement, this.annotation);
          }
          break;
        case AnnotationType.Setup:
          block.setupFunctionName = statement.name.text;
          if (statement.func.parameters.length > 0) {
            diagnosticWrongParameterCount(this.file, statement, 0);
          }
          break;
        case AnnotationType.TearDown:
          block.tearDownFunctionName = statement.name.text;
          if (statement.func.parameters.length > 0) {
            diagnosticWrongParameterCount(this.file, statement, 0);
          }
          break;
        case AnnotationType.BeforeEach:
          block.beforeEachFunctionName = statement.name.text;
          if (statement.func.parameters.length > 0) {
            diagnosticWrongParameterCount(this.file, statement, 0);
          }
          break;
        case AnnotationType.AfterEach:
          block.afterEachFunctionName = statement.name.text;
          if (statement.func.parameters.length > 0) {
            diagnosticWrongParameterCount(this.file, statement, 0);
          }
          break;
        default:
          break;
      }
    }
  }

  public createTestCases(statement: ClassMethodStatement, annotation: Annotation): boolean {
    const lineNumber = statement.func.range.start.line;
    const numberOfArgs = statement.func.parameters.length;
    const numberOfParams = annotation.params.length;
    if (this.currentGroup.testCases.has(annotation.name)) {
      diagnosticTestWithNameAlreadyDefined(annotation);
      return false;
    }
    if (numberOfParams > 0) {
      let index = 0;
      for (const param of annotation.params) {
        if (param.params.length === numberOfArgs) {
          let isSolo = annotation.hasSoloParams ? param.isSolo : annotation.isSolo;
          let isIgnore = annotation.isIgnore ? true : param.isIgnore;
          this.currentGroup.addTestCase(
            new TestCase(annotation.name, statement.name.text, isSolo, isIgnore, lineNumber, param.params, index, param.lineNumber, numberOfArgs)
          );
        } else {
          diagnosticWrongTestParameterCount(this.file, param.token, param.params.length, numberOfArgs);
        }
        index++;
      }
      return true;

    } else if (numberOfParams === 0) {
      this.currentGroup.addTestCase(
        new TestCase(annotation.name, statement.name.text, annotation.isSolo, annotation.isIgnore, lineNumber)
      );
      return true;
    } else {
      diagnosticWrongParameterCount(this.file, statement, 0);
    }
  }
}
