import type {BscFile,
    WalkOptions,
    WalkVisitor} from 'brighterscript';
import {
    Range,
    Statement} from 'brighterscript';

import {SourceNode} from 'source-map';

import type {TranspileState} from 'brighterscript/dist/parser/TranspileState';

export class RawCodeStatement extends Statement {
    constructor(
        public source: string,
        public sourceFile?: BscFile,
        public range: Range = Range.create(1, 1, 1, 99999)
    ) {
        super();
    }

    public transpile(state: TranspileState) {
        return [new SourceNode(
            this.range.start.line + 1,
            this.range.start.character,
            this.sourceFile ? this.sourceFile.pathAbsolute : state.pathAbsolute,
            this.source
        )];
    }
    public walk(visitor: WalkVisitor, options: WalkOptions) {
        //nothing to walk
    }
}
