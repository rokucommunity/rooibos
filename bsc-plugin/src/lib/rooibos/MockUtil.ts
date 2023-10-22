/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { BrsFile, Editor, ProgramBuilder } from 'brighterscript';
import { Position, isClassStatement } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeStatement } from './RawCodeStatement';
import { Range } from 'vscode-languageserver-types';
import type { FileFactory } from './FileFactory';
import undent from 'undent';

export class MockUtil {

    constructor(builder: ProgramBuilder, fileFactory: FileFactory) {
        this.config = (builder.options as any).rooibos as RooibosConfig || {};
        this.filePathMap = {};
        this.fileId = 0;
        this.fileFactory = fileFactory;
        try {
        } catch (e) {
            console.log('Error:', e.stack);
        }
    }

    private brsFileAdditions = `
    function RBS_CC_#ID#_getMocksByFunctionName()
        if m._rMocksByFunctionName = invalid
        m._rMocksByFunctionName = {}
        end if
        return m._rMocksByFunctionName
    end function
`;

    private config: RooibosConfig;
    private fileId: number;
    private filePathMap: any;
    private fileFactory: FileFactory;
    private processedStatements: Set<brighterscript.FunctionExpression>;
    private astEditor: Editor;

    public enableGlobalMethodMocks(file: BrsFile, astEditor: Editor) {
        if (this.config.isGlobalMethodMockingEnabled) {
            this._processFile(file, astEditor);
        }
    }

    public _processFile(file: BrsFile, astEditor: Editor) {
        this.fileId++;
        this.processedStatements = new Set<brighterscript.FunctionExpression>();
        this.astEditor = astEditor;

        for (let fs of file.parser.references.functionExpressions) {
            this.enableMockOnFunction(fs);
        }

        this.filePathMap[this.fileId] = file.pkgPath;
        if (this.processedStatements.size > 0) {
            this.addBrsAPIText(file);
        }
    }

    private enableMockOnFunction(functionExpression: brighterscript.FunctionExpression) {
        if (isClassStatement(functionExpression.parent?.parent)) {
            return;
        }
        if (this.processedStatements.has(functionExpression)) {
            return;
        }

        const methodName = functionExpression.functionStatement.getName(brighterscript.ParseMode.BrightScript);
        for (let param of functionExpression.parameters) {
            param.asToken = null;
        }
        const paramNames = functionExpression.parameters.map((param) => param.name.text).join(',');

        const returnStatement = (functionExpression.functionType.kind === brighterscript.TokenKind.Sub || functionExpression.returnTypeToken?.kind === brighterscript.TokenKind.Void) ? 'return' : 'return result';
        this.astEditor.addToArray(functionExpression.body.statements, 0, new RawCodeStatement(undent`
            if RBS_CC_${this.fileId}_getMocksByFunctionName()["${methodName}"] <> invalid
                result = RBS_CC_${this.fileId}_getMocksByFunctionName()["${methodName}"].callback(${paramNames})
                ${returnStatement}
            end if
            `));

        this.processedStatements.add(functionExpression);
    }

    public addBrsAPIText(file: BrsFile) {
        //TODO should use ast editor!
        const func = new RawCodeStatement(this.brsFileAdditions.replace(/\#ID\#/g, this.fileId.toString().trim()), file, Range.create(Position.create(1, 1), Position.create(1, 1)));
        file.ast.statements.push(func);
    }

}

