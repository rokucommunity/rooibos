import type {
    BscFile,
    SourceInfo,
    WalkOptions,
    WalkVisitor
} from 'brighterscript';
import {
    AstNodeKind,
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
        //raw code has no position in any parsed source, so it is a synthetic node
        util.setBounds(this);
    }

    readonly kind = AstNodeKind.Body;

    public readonly startPosition: number;
    public readonly endPosition: number;
    public readonly sourceInfo: SourceInfo | undefined;

    public transpile(state: BrsTranspileState) {
        //indent every line with the current transpile indent level (except the first line, because that's pre-indented by bsc)
        let source = this.source.replace(/\r?\n/g, (match, newline) => {
            return state.newline + state.indent();
        });

        //synthetic code has no source position to map back to
        return [new SourceNode(
            null,
            null,
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
