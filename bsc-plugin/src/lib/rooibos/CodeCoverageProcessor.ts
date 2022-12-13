/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { BrsFile, ProgramBuilder, Statement } from 'brighterscript';
import { isIfStatement, Position, WalkMode, createVisitor } from 'brighterscript';
import * as brighterscript from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeStatement } from './RawCodeStatement';
import { TranspileState } from 'brighterscript/dist/parser/TranspileState';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
import { Range } from 'vscode-languageserver-types';
import { RawCodeExpression } from './RawCodeExpression';
import type { FileFactory } from './FileFactory';

export enum CodeCoverageLineType {
    noCode = 0,
    code = 1,
    condition = 2,
    branch = 3
}

export class CodeCoverageProcessor {

    private coverageBrsTemplate = `
    function RBS_CC_#ID#_reportLine(lineNumber, reportType = 1)
  if m.global = invalid
    '? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
    return true
  else
    if m._rbs_ccn = invalid
     '? "Coverage maps are not created - creating now"
      if m.global._rbs_ccn = invalid
        '? "Coverage maps are not created - creating now"
          m.global.addFields({
            "_rbs_ccn": createObject("roSGNode", "CodeCoverage")
          })
      end if
      m._rbs_ccn = m.global._rbs_ccn
     end if
  end if

  m._rbs_ccn.entry = {"f":"#ID#", "l":stri(lineNumber), "r":reportType}
  return true
end function
`;

    constructor(builder: ProgramBuilder, fileFactory: FileFactory) {
        this.config = (builder.options as any).rooibos as RooibosConfig || {};
        this.expectedCoverageMap = {};
        this.filePathMap = {};
        this.fileId = 0;
        try {
        } catch (e) {
            console.log('Error:', e.stack);
        }
    }

    private config: RooibosConfig;
    private fileId: number;
    private filePathMap: any;
    private expectedCoverageMap: any;
    private executableLines: Map<number, Statement>;
    private transpileState: BrsTranspileState;
    private coverageMap: Map<number, number>;
    private fileFactory: FileFactory;

    public generateMetadata(isUsingCoverage: boolean) {
        if (isUsingCoverage) {
            this.fileFactory.createCoverageComponent(this.coverageMap, this.filePathMap);
        } else {
            this.fileFactory.createCoverageComponent(undefined, undefined);
        }
    }

    public addCodeCoverage(file: BrsFile) {
        //not yet supported
        this.transpileState = new BrsTranspileState(file);
        this._processFile(file);
    }

    public _processFile(file: BrsFile) {
        this.fileId++;
        this.coverageMap = new Map<number, number>();
        this.executableLines = new Map<number, Statement>();

        file.ast.walk(createVisitor({
            ForStatement: (ds) => {
                this.addStatement(ds);
                ds.forToken.text = `${this.getFuncCallText(ds.range.start.line, CodeCoverageLineType.code)}: for`;
            },
            IfStatement: (ds) => {
                let ifStatement = ds;
                while (isIfStatement(ifStatement)) {
                    this.addStatement(ds);
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    (ifStatement as any).condition = new brighterscript.BinaryExpression(new RawCodeExpression(this.getFuncCallText(ds.condition.range.start.line, CodeCoverageLineType.branch)), brighterscript.createToken(brighterscript.TokenKind.And), (ifStatement as any).condition);
                    ifStatement = ifStatement.elseBranch as any;
                }
                let blockStatements = (ifStatement as any)?.statements as any[] ?? [];
                if (blockStatements?.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText((ifStatement as any).range.start.line - 1, CodeCoverageLineType.branch));
                    blockStatements.splice(0, 0, coverageStatement);
                }
            },
            GotoStatement: (ds) => {
                this.addStatement(ds);
                return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);

            },
            WhileStatement: (ds) => {
                ds.tokens.while.text = `${this.getFuncCallText(ds.range.start.line, CodeCoverageLineType.code)}: while`;
            },
            ReturnStatement: (ds) => {
                this.addStatement(ds);
                return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);
            },
            ForEachStatement: (ds) => {
                this.addStatement(ds);
                ds.tokens.forEach.text = `${this.getFuncCallText(ds.range.start.line, CodeCoverageLineType.code)}: for each`;
            },
            ExitWhileStatement: (ds) => {

            },
            PrintStatement: (ds) => {
                this.addStatement(ds);
                return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);
            },
            DottedSetStatement: (ds) => {
                this.addStatement(ds);
                return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);

            },
            IndexedSetStatement: (ds) => {
                this.addStatement(ds);
                return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);

            },
            IncrementStatement: (ds) => {
                this.addStatement(ds);
                return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);

            },
            AssignmentStatement: (ds, parent) => {
                if (!brighterscript.isForStatement(parent)) {
                    this.addStatement(ds);
                    return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);
                }

            },
            ExpressionStatement: (ds) => {
                this.addStatement(ds);
                return this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code);
            }
        }), { walkMode: WalkMode.visitAllRecursive });


        this.expectedCoverageMap[this.fileId.toString().trim()] = Array.from(this.coverageMap);
        this.filePathMap[this.fileId] = file.pkgPath;
        this.addBrsAPIText(file);
    }

    private convertStatementToCoverageStatement(statement: Statement, coverageType: CodeCoverageLineType) {
        const lineNumber = statement.range.start.line;
        this.coverageMap.set(lineNumber, coverageType);
        return new RawCodeStatement(`
        ${this.getFuncCallText(lineNumber, coverageType)}
        ${statement.transpile(this.transpileState).join('')}`, this.transpileState.file, statement.range);
    }

    public addBrsAPIText(file: BrsFile) {
        const func = new RawCodeStatement(this.coverageBrsTemplate.replace(/\#ID\#/g, this.fileId.toString().trim()), file, Range.create(Position.create(1, 1), Position.create(1, 1)));
        file.ast.statements.push(func);
    }

    private addStatement(statement: Statement, lineNumber?: number) {
        if (!this.executableLines.has(lineNumber)) {
            this.executableLines.set(lineNumber, statement);
        } else {
            console.debug(`line was already registered`);
        }
    }

    private getFuncCallText(lineNumber: number, lineType: CodeCoverageLineType) {
        return `RBS_CC_${this.fileId}_reportLine(${lineNumber.toString().trim()}, ${lineType.toString().trim()})`;
    }
}
