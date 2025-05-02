import type { RooibosAnnotation } from './Annotation';
import { sanitizeBsJsonString } from './Utils';

export class TestCase {
    constructor(annotation: RooibosAnnotation, name: string, funcName: string, isSolo: boolean, isIgnored: boolean, lineNumber: number,
        params: any[] = null, paramTestIndex = 0, paramLineNumber = 0, expectedNumberOfParams = 0) {
        this.annotation = annotation;
        this.isSolo = isSolo;
        this.isAsync = annotation.isAsync;
        this.asyncTimeout = annotation.asyncTimeout;
        this.slow = annotation.slow;
        this.funcName = funcName;
        this.isIgnored = isIgnored;
        this.name = name;
        this.lineNumber = lineNumber;
        this.paramLineNumber = paramLineNumber;
        this.assertIndex = 0;
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
    public isAsync: boolean;
    public asyncTimeout: number;
    public slow: number;
    public name: string;
    public lineNumber: number;
    public paramLineNumber: number;
    public assertIndex: number;
    public expectedNumberOfParams: number;
    public rawParams: any[];
    public paramTestIndex: number;

    public asText(): string {
        let rawParamsText = this.fixBadJson(this.rawParams).replace(/null/g, 'invalid');

        return `
        {
          isSolo: ${this.isSolo}
          noCatch: ${this.annotation.noCatch}
          funcName: "${this.funcName || ''}"
          isIgnored: ${this.isIgnored}
          isAsync: ${this.isAsync}
          asyncTimeout: ${this.asyncTimeout || 2000}
          slow: ${this.slow}
          isParamTest: ${this.isParamTest}
          name: ${sanitizeBsJsonString(this.name)}
          lineNumber: ${this.lineNumber + 1}
          paramLineNumber: ${this.isParamTest ? this.paramLineNumber + 1 : 0}
          assertIndex: ${this.assertIndex}
          rawParams: ${rawParamsText}
          paramTestIndex: ${this.paramTestIndex}
          expectedNumberOfParams: ${this.expectedNumberOfParams}
          isParamsValid: ${(this.rawParams || []).length === this.expectedNumberOfParams}
        }`;
    }

    fixBadJson(o) {
        // In case of an array we'll stringify all objects.
        if (Array.isArray(o)) {
            return `[${o.map(obj => `${this.fixBadJson(obj)}`).join(',')}]`;
        }
        // not an object, stringify using native function
        if (typeof o !== 'object' || o === null) {
            return JSON.stringify(o);
        }
        return `{${Object
            .keys(o)
            .map(key => {
                return `"${key.replace(/"/g, '')}":${this.fixBadJson(o[key])}`;
            })
            .join(',')}}`;
    }

}
