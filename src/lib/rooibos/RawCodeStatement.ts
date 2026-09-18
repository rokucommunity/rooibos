import type {
    BscFile,
    WalkOptions,
    WalkVisitor
} from 'brighterscript';
import {
    AstNodeKind,
    Range,
    Statement,
    util
} from 'brighterscript';

import { SourceNode } from 'source-map';

import type { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';

export class RawCodeStatement extends Statement {

    constructor(
        public source: string,
        public sourceFile?: BscFile
    ) {
        super();
    }
    private fakeRange = Range.create(1, 1, 1, 99999);

    readonly kind = AstNodeKind.Body;

    get location() {
        return util.createLocationFromFileRange(this.sourceFile, this.fakeRange);
    }

    public transpile(state: BrsTranspileState) {
        //indent every line with the current transpile indent level (except the first line, because that's pre-indented by bsc)
        let source = this.source.replace(/\r?\n/g, (match, newline) => {
            return state.newline + state.indent();
        });

        return [new SourceNode(
            this.fakeRange.start.line + 1,
            this.fakeRange.start.character,
            this.sourceFile ? this.sourceFile.srcPath : state.srcPath,
            source
        )];
    }
    public walk(visitor: WalkVisitor, options: WalkOptions) {
        //nothing to walk
    }

    public clone() {
        return new RawCodeStatement(this.source, this.sourceFile);
    }
}
