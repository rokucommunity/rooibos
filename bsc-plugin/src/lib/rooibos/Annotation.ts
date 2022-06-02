import type { BrsFile, Statement, AnnotationExpression } from 'brighterscript';
import { diagnosticIllegalParams, diagnosticNoTestNameDefined, diagnosticMultipleDescribeAnnotations, diagnosticMultipleTestOnFunctionDefined } from '../utils/Diagnostics';

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
    SoloParams = 'onlyparams',
    Tags = 'tags',
    NoCatch = 'nocatch',
    NoEarlyExit = 'noearlyexit'
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
    onlyparams: AnnotationType.SoloParams,
    tags: AnnotationType.Tags,
    nocatch: AnnotationType.NoCatch,
    noearlyexit: AnnotationType.NoEarlyExit
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
        public isSolo = false,
        public noCatch = false,
        public noearlyexit = false
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
        public nodeName?: string,
        rawTags: string[] = [],
        public noCatch = false,
        public noEarlyExit = false
    ) {
        this.tags = new Set<string>(rawTags);
    }
    public tags;
    public hasSoloParams = false;

    public static getAnnotation(file: BrsFile, statement: Statement): ParsedComment | null {

        //split annotations in case they include an it group..
        let blockAnnotation: RooibosAnnotation;
        let testAnnotation: RooibosAnnotation;
        let isSolo = false;
        let isIgnore = false;
        let noCatch = false;
        let noEarlyExit = false;
        let nodeName = null;
        let tags = [] as string[];
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
                    case AnnotationType.NoEarlyExit:
                        noEarlyExit = true;
                        break;
                    case AnnotationType.NoCatch:
                        noCatch = true;
                        break;
                    case AnnotationType.Solo:
                        isSolo = true;
                        break;
                    case AnnotationType.NodeTest:
                        nodeName = annotation.getArguments()[0] as string;
                        break;
                    case AnnotationType.Tags:
                        tags = annotation.getArguments().map((a) => a.toString());
                        break;
                    case AnnotationType.Ignore:
                        isIgnore = true;
                        break;
                    case AnnotationType.BeforeEach:
                    case AnnotationType.AfterEach:
                    case AnnotationType.Setup:
                    case AnnotationType.TearDown:
                        testAnnotation = new RooibosAnnotation(file, annotation, annotationType, annotation.name, annotation.name);
                        break;
                    case AnnotationType.Describe:
                    case AnnotationType.TestSuite:
                        const groupName = annotation.getArguments()[0] as string;
                        blockAnnotation = new RooibosAnnotation(file, annotation, annotationType, annotation.name, groupName, isIgnore, isSolo, null, nodeName, tags, noCatch, noEarlyExit);
                        nodeName = null;
                        isSolo = false;
                        isIgnore = false;
                        break;
                    case AnnotationType.It:
                        const testName = annotation.getArguments()[0] as string;
                        if (!testName || testName.trim() === '') {
                            diagnosticNoTestNameDefined(file, annotation);
                        }
                        let newAnnotation = new RooibosAnnotation(file, annotation, annotationType, annotation.name, testName, isIgnore, isSolo, undefined, undefined, tags, noCatch);
                        if (testAnnotation) {
                            diagnosticMultipleTestOnFunctionDefined(file, newAnnotation.annotation);
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
                            testAnnotation.parseParams(file, annotation, annotationType, noCatch);
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
        return { blockAnnotation: blockAnnotation, testAnnotation: testAnnotation };
    }

    public parseParams(file: BrsFile, annotation: AnnotationExpression, annotationType: AnnotationType, noCatch: boolean) {
        let rawParams = JSON.stringify(annotation.getArguments());
        let isSolo = annotationType === AnnotationType.SoloParams;
        let isIgnore = annotationType === AnnotationType.IgnoreParams;
        if (isSolo) {
            this.hasSoloParams = true;
        }
        try {
            if (rawParams) {
                this.params.push(new AnnotationParams(annotation, rawParams, annotation.range.start.line, annotation.getArguments() as any, isIgnore, isSolo, noCatch));
            } else {
                diagnosticIllegalParams(file, annotation);
            }
        } catch (e) {
            diagnosticIllegalParams(file, annotation);
        }
    }

}

export function getAnnotationType(text: string): AnnotationType {
    return annotationLookup[text.toLowerCase()] || AnnotationType.None;
}
