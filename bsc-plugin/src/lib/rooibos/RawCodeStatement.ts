import type {
    BscFile,
    WalkOptions,
    WalkVisitor
} from 'brighterscript';
import {
    Range,
    Expression,
    Statement,
    AstNodeKind
} from 'brighterscript';

import { SourceNode } from 'source-map';

import type { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';

export class RawCodeStatement extends Statement {
    kind = AstNodeKind.Body;

    constructor(
        public source: string,
        public sourceFile?: BscFile,
        public range: Range = Range.create(1, 1, 1, 99999)
    ) {
        super();
    }

    public transpile(state: BrsTranspileState) {
        //indent every line with the current transpile indent level (except the first line, because that's pre-indented by bsc)
        let source = this.source.replace(/\r?\n/g, (match, newline) => {
            return state.newline + state.indent();
        });

        return [new SourceNode(
            this.range.start.line + 1,
            this.range.start.character,
            this.sourceFile ? this.sourceFile.srcPath : state.srcPath,
            source
        )];
    }
    public walk(visitor: WalkVisitor, options: WalkOptions) {
        //nothing to walk
    }
}
export class RawCodeExpression extends Expression {
    kind = AstNodeKind.Body;

    constructor(
        public source: string,
        public sourceFile?: BscFile,
        public range: Range = Range.create(1, 1, 1, 99999)
    ) {
        super();
    }

    public transpile(state: BrsTranspileState) {
        //indent every line with the current transpile indent level (except the first line, because that's pre-indented by bsc)
        let source = this.source.replace(/\r?\n/g, (match, newline) => {
            return state.newline + state.indent();
        });

        return [new SourceNode(
            this.range.start.line + 1,
            this.range.start.character,
            this.sourceFile ? this.sourceFile.srcPath : state.srcPath,
            source
        )];
    }
    public walk(visitor: WalkVisitor, options: WalkOptions) {
        //nothing to walk
    }
}
