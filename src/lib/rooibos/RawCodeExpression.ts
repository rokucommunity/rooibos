import type { AstNodeKind, BscFile, SourceInfo, WalkOptions, WalkVisitor } from 'brighterscript';
import { Expression, util } from 'brighterscript';
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
    readonly kind = 'RawCodeExpression' as AstNodeKind;

    public readonly startPosition: number;
    public readonly endPosition: number;
    public readonly sourceInfo: SourceInfo | undefined;

    public transpile(state: BrsTranspileState) {
        //synthetic code has no source position to map back to
        return [new SourceNode(
            null,
            null,
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
