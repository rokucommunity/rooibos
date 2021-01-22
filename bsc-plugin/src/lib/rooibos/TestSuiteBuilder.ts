
import type {BrsFile,
    ClassMethodStatement,
    ClassStatement} from 'brighterscript';
import {
    isClassMethodStatement
} from 'brighterscript';

import {TestGroup} from './TestGroup';

import {RooibosAnnotation, AnnotationType} from './Annotation';

import {TestCase} from './TestCase';
import {TestSuite} from './TestSuite';

import {
    diagnosticDuplicateSuite,
    diagnosticErrorProcessingFile,
    diagnosticGroupWithNameAlreadyDefined,
    diagnosticIncompatibleAnnotation,
    diagnosticNoGroup,
    diagnosticTestWithNameAlreadyDefined,
    diagnosticWrongAnnotation,
    diagnosticWrongParameterCount,
    diagnosticWrongTestParameterCount,
    diagnosticEmptyGroup,
    diagnosticTestWithArgsButNoParams
} from '../utils/Diagnostics';
import type {RooibosSession} from './RooibosSession';

export class TestSuiteBuilder {
    constructor(public session: RooibosSession) {
    }

    //state
    private currentGroup?: TestGroup;
    private annotation?: RooibosAnnotation;
    private testSuite: TestSuite;
    private file: BrsFile;

    public processFile(file: BrsFile): TestSuite[] {
        this.file = file;
        let suites = [];
        try {
            for (let cs of file.parser.references.classStatements) {

                //a test is comprised of a comment block; followed by a class
                let annotation = RooibosAnnotation.getAnnotation(file, cs)?.blockAnnotation;

                if (annotation) {
                    if (annotation.annotationType === AnnotationType.TestSuite) {
                        this.addSuiteIfValid(file, annotation, cs, suites);
                    } else {
                        diagnosticWrongAnnotation(file, cs, 'Expected a TestSuite annotation, got: ' + annotation.annotationType);
                        throw new Error('bad test suite');
                    }
                }
            }
        } catch (e) {
            // console.log(e);
            diagnosticErrorProcessingFile(file, e.message);
        }
        this.session.sessionInfo.updateTestSuites(suites);
        return suites;
    }

    public addSuiteIfValid(file: BrsFile, annotation: RooibosAnnotation, s: ClassStatement, suites: TestSuite[]) {
        let oldSuite = this.session.sessionInfo.testSuites.get(annotation.name);
        let suite = this.processClass(annotation, s);
        let isDuplicate = false;
        if ((oldSuite && oldSuite.file.pathAbsolute !==
            file.pathAbsolute)) {
            oldSuite.isValid = false;
            suite.isValid = false;
            diagnosticDuplicateSuite(file, oldSuite.classStatement, oldSuite.annotation);
            isDuplicate = true;
        }

        let duplicateSuites = suites.filter((s) => s.name === suite.name);
        if (duplicateSuites.length > 0) {
            for (let duplicateSuite of duplicateSuites) {
                duplicateSuite.isValid = false;
                diagnosticDuplicateSuite(file, duplicateSuite.classStatement, duplicateSuite.annotation);
            }
            suite.isValid = false;
            isDuplicate = true;
        }

        suites.push(suite);
        if (isDuplicate) {
            diagnosticDuplicateSuite(file, suite.classStatement, suite.annotation);
        }
    }

    public processClass(annotation: RooibosAnnotation, classStatement: ClassStatement): TestSuite {
        this.testSuite = new TestSuite(annotation, classStatement);
        this.currentGroup = null;
        this.annotation = null;
        for (let s of classStatement.body) {
            let {blockAnnotation, testAnnotation} = RooibosAnnotation.getAnnotation(this.file, s);
            if (blockAnnotation) {
                if (this.annotation) {
                    diagnosticNoGroup(this.file, s);
                }
                if (this.currentGroup) {
                    this.testSuite.addGroup(this.currentGroup);
                    if (this.currentGroup.testCases.size === 0) {
                        diagnosticEmptyGroup(this.file, this.currentGroup.annotation);
                    }
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

            if (isClassMethodStatement(s)) {
                this.processClassMethod(s);
            }
            this.annotation = null;
        }

        if (this.currentGroup) {
            this.testSuite.addGroup(this.currentGroup);
        }
        this.testSuite.isValid = this.testSuite.file.getDiagnostics().length === 0;
        return this.testSuite;
    }

    public isAllowedAnnotation(annotation: RooibosAnnotation): boolean {
        switch (this.annotation ? this.annotation.annotationType : AnnotationType.None) {
            case AnnotationType.TestSuite:
            case AnnotationType.Setup:
            case AnnotationType.TearDown:
            case AnnotationType.BeforeEach:
            case AnnotationType.AfterEach:
                return false;
            case AnnotationType.None:
            default:
                return true;
        }
    }
    public createGroup(blockAnnotation: RooibosAnnotation): boolean {
        if (!this.testSuite.testGroups.has(blockAnnotation.name)) {
            this.currentGroup = new TestGroup(this.testSuite, blockAnnotation);
            return true;
        } else {
            diagnosticGroupWithNameAlreadyDefined(this.file, blockAnnotation);
            diagnosticGroupWithNameAlreadyDefined(this.file, this.testSuite.testGroups.get(blockAnnotation.name).annotation);
            return false;
        }
    }

    public processClassMethod(statement: ClassMethodStatement) {
        let block = this.currentGroup ?? this.testSuite;

        if (this.annotation) {
            switch (this.annotation.annotationType) {
                case AnnotationType.It:
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

    public createTestCases(statement: ClassMethodStatement, annotation: RooibosAnnotation): boolean {
        const lineNumber = statement.func.range.start.line;
        const numberOfArgs = statement.func.parameters.length;
        const numberOfParams = annotation.params.length;
        if (this.currentGroup.testCases.has(annotation.name) || this.currentGroup.testCases.get(annotation.name + '0')?.paramLineNumber) {
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
                        new TestCase(annotation, annotation.name, statement.name.text, isSolo, isIgnore, lineNumber, param.params, index, param.lineNumber, numberOfArgs)
                    );
                } else {
                    diagnosticWrongTestParameterCount(this.file, param.annotation, param.params.length, numberOfArgs);
                }
                index++;
            }
            return true;

        } else if (numberOfParams === 0) {
            if (numberOfArgs === 0) {
                this.currentGroup.addTestCase(
                    new TestCase(annotation, annotation.name, statement.name.text, annotation.isSolo, annotation.isIgnore, lineNumber)
                );
            } else {
                diagnosticTestWithArgsButNoParams(this.file, annotation.annotation, numberOfArgs);
            }
            return true;
        } else {
            diagnosticWrongParameterCount(this.file, statement, 0);
        }
    }
}
