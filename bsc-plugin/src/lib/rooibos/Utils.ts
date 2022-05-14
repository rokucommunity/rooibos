import type { BrsFile, ClassStatement, Expression, FunctionStatement, Statement, AnnotationExpression, AstEditor } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import { diagnosticCorruptTestProduced } from '../utils/Diagnostics';
import { SourceNode } from 'source-map';

export function overrideAstTranspile(editor: AstEditor, node: Expression | Statement, value: string) {
    editor.setProperty(node, 'transpile', function transpile(this: Expression | Statement, state) {
        //indent every line with the current transpile indent level (except the first line, because that's pre-indented by bsc)
        let source = value.replace(/\r?\n/g, (match, newline) => {
            return state.newline + state.indent();
        });

        return [new SourceNode(
            this.range.start.line + 1,
            this.range.start.character,
            state.srcPath,
            source
        )];
    });
}

export function addOverriddenMethod(file: BrsFile, annotation: AnnotationExpression, target: ClassStatement, name: string, source: string, editor: AstEditor): boolean {
    let functionSource = `
        function ${name}()
            ${source}
        end function
    `;

    let { statements, diagnostics } = brighterscript.Parser.parse(functionSource, { mode: brighterscript.ParseMode.BrighterScript });
    let error = '';
    if (statements && statements.length > 0) {
        let statement = statements[0] as FunctionStatement;
        if (statement.func.body.statements.length > 0) {
            let p = brighterscript.createToken(brighterscript.TokenKind.Public, 'public', target.range);
            let o = brighterscript.createToken(brighterscript.TokenKind.Override, 'override', target.range);
            let n = brighterscript.createIdentifier(name, target.range);
            let method = new brighterscript.ClassMethodStatement(p, n, statement.func, o);
            //bsc has a quirk where it auto-adds a `new` method if missing. That messes with our AST editing, so
            //trigger that functionality BEFORE performing AstEditor operations. TODO remove this whenever bsc stops doing this.
            // eslint-disable-next-line @typescript-eslint/dot-notation
            target['ensureConstructorFunctionExists']?.();
            editor.addToArray(target.body, target.body.length, method);
            return true;
        }

    }
    error = diagnostics?.length > 0 ? diagnostics[0].message : 'unknown error';
    diagnosticCorruptTestProduced(file, annotation, error, functionSource);
    return false;
}

export function sanitizeBsJsonString(text: string) {
    return `"${text ? text.replace(/"/g, '\'') : ''}"`;
}
