import type {
    BscFile,
    WalkOptions,
    WalkVisitor
} from 'brighterscript';
import { Expression, Range } from 'brighterscript';
import type { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';

import { SourceNode } from 'source-map';

export class RawCodeExpression extends Expression {
    constructor(
        public source: string,
        public sourceFile?: BscFile,
        public range: Range = Range.create(1, 1, 1, 99999)
    ) {
        super();
    }

    public clone() {
        return new RawCodeExpression(this.source, this.sourceFile, this.range);
    }

    public transpile(state: BrsTranspileState) {
        return [new SourceNode(
            this.range.start.line + 1,
            this.range.start.character,
            this.sourceFile ? this.sourceFile.pathAbsolute : state.srcPath,
            this.source
        )];
    }
    public walk(visitor: WalkVisitor, options: WalkOptions) {
        //nothing to walk
    }
}
