import type { AstNodeKind, BscFile, WalkOptions, WalkVisitor } from 'brighterscript';
import { Expression, Range, util } from 'brighterscript';
import type { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';

import { SourceNode } from 'source-map';

export class RawCodeExpression extends Expression {
    constructor(
        public source: string,
        public sourceFile?: BscFile
    ) {
        super();
    }
    private fakeRange = Range.create(1, 1, 1, 99999);
    readonly kind = 'RawCodeExpression' as AstNodeKind;

    get location() {
        return util.createLocationFromFileRange(this.sourceFile, this.fakeRange);
    }

    public transpile(state: BrsTranspileState) {
        return [new SourceNode(
            this.fakeRange.start.line + 1,
            this.fakeRange.start.character,
            this.sourceFile ? this.sourceFile.srcPath : state.srcPath,
            this.source
        )];
    }
    public walk(visitor: WalkVisitor, options: WalkOptions) {
        //nothing to walk
    }

    public clone() {
        return new RawCodeExpression(this.source, this.sourceFile);
    }
}
