import type {BrsFile, Statement, AnnotationExpression} from 'brighterscript';
import { diagnosticIllegalParams, diagnosticNoTestFunctionDefinedasdiagnosticMultipleTestOnFunctionDefined, diagnosticNoTestNameDefined, diagnosticMultipleDescribeAnnotations } from '../utils/Diagnostics';

export enum AnnotationType {
    None = 'none',
    TestSuite = 'suite',
    Describe = 'describe',
    It = 'it',
    Ignore = 'ignore',
    Solo = 'only',
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
    suite: AnnotationType.TestSuite,
    describe: AnnotationType.Describe,
    it: AnnotationType.It,
    ignore: AnnotationType.Ignore,
    only: AnnotationType.Solo,
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
        public params: any[],
        public isIgnore = false,
        public isSolo = false
    ) {

    }
}
export class RooibosAnnotation {
    /**
     * Represents a group of comments which contain tags such as @only, @suite, @describe, @it etc
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
            let describeAnnotations = statement.annotations.filter((a) => getAnnotationType(a.name) === AnnotationType.Describe);
            if (describeAnnotations.length > 1) {
                for (let a of describeAnnotations) {
                    diagnosticMultipleDescribeAnnotations(file, a);
                }
            }
            for (let annotation of statement.annotations) {
                const annotationType = getAnnotationType(annotation.name);
                switch (annotationType) {
                    case AnnotationType.Solo:
                        isSolo = true;
                        break;
                    case AnnotationType.NodeTest:
                        nodeName = annotation.getArguments()[0] as string;
                        break;
                    case AnnotationType.Ignore:
                        isIgnore = true;
                        break;
                    case AnnotationType.Describe:
                    case AnnotationType.TestSuite:
                        const groupName = annotation.getArguments()[0] as string;
                        blockAnnotation = new RooibosAnnotation(file, annotation, annotationType, annotation.name, groupName, isIgnore, isSolo, null, nodeName);
                        nodeName = null;
                        isSolo = false;
                        isIgnore = false;
                        break;
                    case AnnotationType.It:
                        const testName = annotation.getArguments()[0] as string;
                        if (!testName || testName.trim() === '') {
                            diagnosticNoTestNameDefined(file, annotation);
                        }
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
                    case AnnotationType.None:
                    default:
                        continue;
                }
            }
        }
        return {blockAnnotation: blockAnnotation, testAnnotation: testAnnotation};
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
