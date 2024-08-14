import type { BscFile,
    WalkOptions,
    WalkVisitor } from 'brighterscript';
import { Expression } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import type { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';

import { SourceNode } from 'source-map';

export class RawCodeExpression extends Expression {
    constructor(
        public source: string,
        public sourceFile?: BscFile,
        public range: brighterscript.Range = brighterscript.Range.create(1, 1, 1, 99999)
    ) {
        super();
    }

    readonly kind = 'RawCodeExpression' as brighterscript.AstNodeKind;

    get location() {
        return brighterscript.util.createLocationFromFileRange(this.sourceFile, this.range);
    }

    public transpile(state: BrsTranspileState) {
        return [new SourceNode(
            this.range.start.line + 1,
            this.range.start.character,
            this.sourceFile ? this.sourceFile.srcPath : state.srcPath,
            this.source
        )];
    }
    public walk(visitor: WalkVisitor, options: WalkOptions) {
        //nothing to walk
    }
}
