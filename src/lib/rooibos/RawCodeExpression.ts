import type { AstNodeKind, BscFile, SourceInfo, WalkOptions, WalkVisitor } from 'brighterscript';
import { Expression, Range, util } from 'brighterscript';
import type { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';

import { SourceNode } from 'source-map';

export class RawCodeExpression extends Expression {
    constructor(
        public source: string,
        public sourceFile?: BscFile
    ) {
        super();
        //raw code has no position in any parsed source, so it is a synthetic node
        util.setBounds(this);
    }
    private fakeRange = Range.create(1, 1, 1, 99999);
    readonly kind = 'RawCodeExpression' as AstNodeKind;

    public readonly startPosition: number;
    public readonly endPosition: number;
    public readonly sourceInfo: SourceInfo | undefined;

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
