/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { BrsFile, Editor, ExpressionStatement, FunctionExpression, Program, ProgramBuilder, Statement } from 'brighterscript';
import { Parser, WalkMode, createVisitor, BinaryExpression, createToken, TokenKind, GroupingExpression, isForStatement, isBlock, isFunctionExpression, ParseMode } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeStatement } from './RawCodeStatement';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
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
        function RBS_CC_#ID#_reportLine(lineNumber, reportType = 1, funcId = -1)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "l": lineNumber, "r": reportType, "fn": funcId }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "l": lineNumber, "r": reportType, "fn": funcId }
                m._rbs_ccn = _rbs_ccn
                return true
            end if
            return true
        end function
    `;

    constructor(builder: ProgramBuilder, fileFactory: FileFactory) {
        this.config = (builder.options as any).rooibos as RooibosConfig || {};
        this.expectedCoverageMap = {};
        this.filePathMap = {};
        this.functionMap = [];
        this.fileId = 0;
        this.functionId = 0;
        this.fileFactory = fileFactory;
        this.processedFunctions = new Set<FunctionExpression>();
        try {
        } catch (e) {
            console.log('Error:', e.stack);
        }
    }

    private config: RooibosConfig;
    private fileId: number;
    private functionId: number;
    private filePathMap: any;
    private functionMap: Array<Array<string>>;
    private expectedCoverageMap: any;
    private executableLines: Map<number, Statement>;
    private transpileState: BrsTranspileState;
    private coverageMap: Map<number, number>;
    private fileFactory: FileFactory;
    private processedStatements: Set<Statement>;
    private processedFunctions: Set<FunctionExpression>;
    private astEditor: Editor;

    public generateMetadata(isUsingCoverage: boolean, program: Program) {
        this.fileFactory.createCoverageComponent(program, this.expectedCoverageMap, this.filePathMap, this.functionMap);
    }

    public addCodeCoverage(file: BrsFile, astEditor: Editor) {
        if (this.config.isRecordingCodeCoverage) {
            this.transpileState = new BrsTranspileState(file);
            this._processFile(file, astEditor);
        }
    }

    public _processFile(file: BrsFile, astEditor: Editor) {
        this.fileId++;
        this.coverageMap = new Map<number, number>();
        this.executableLines = new Map<number, Statement>();
        this.processedStatements = new Set<Statement>();
        this.astEditor = astEditor;

        file.ast.walk(createVisitor({
            ForStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                ds.forToken.text = `${this.getFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: for`;
            },
            IfStatement: (ifStatement, parent, owner, key) => {
                this.addStatement(ifStatement);
                (ifStatement as any).condition = new BinaryExpression(
                    new RawCodeExpression(this.getFuncCallText(ifStatement.condition.range.start.line, CodeCoverageLineType.condition, ifStatement)),
                    createToken(TokenKind.And),
                    new GroupingExpression({
                        left: createToken(TokenKind.LeftParen),
                        right: createToken(TokenKind.RightParen)
                    }, ifStatement.condition)
                );

                let blockStatements = ifStatement?.thenBranch?.statements;
                if (blockStatements) {
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText(ifStatement.range.start.line, CodeCoverageLineType.branch, ifStatement));
                    blockStatements.splice(0, 0, coverageStatement);
                }

                // Handle the else blocks
                let elseBlock = ifStatement.elseBranch;
                if (isBlock(elseBlock) && elseBlock.statements) {
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText(elseBlock.range.start.line - 1, CodeCoverageLineType.branch, elseBlock));
                    elseBlock.statements.splice(0, 0, coverageStatement);
                }

            },
            GotoStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            WhileStatement: (ds, parent, owner, key) => {
                ds.tokens.while.text = `${this.getFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: while`;
            },
            ReturnStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ForEachStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                ds.tokens.forEach.text = `${this.getFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: for each`;
            },
            ExitWhileStatement: (ds, parent, owner, key) => {

            },
            PrintStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            DottedSetStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            IndexedSetStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            IncrementStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            AssignmentStatement: (ds, parent, owner, key) => {
                if (!isForStatement(parent)) {
                    this.addStatement(ds);
                    this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
                }

            },
            ExpressionStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            }
        }), { walkMode: WalkMode.visitAllRecursive });

        const coverageMapObject = {};
        for (let key of this.coverageMap.keys()) {
            coverageMapObject[key] = this.coverageMap.get(key);
        }
        this.expectedCoverageMap[this.fileId.toString().trim()] = coverageMapObject;
        this.filePathMap[this.fileId] = file.pkgPath;
        this.addBrsAPIText(file, astEditor);
    }

    private convertStatementToCoverageStatement(statement: Statement, coverageType: CodeCoverageLineType, owner: any, key: any) {
        if (this.processedStatements.has(statement)) {
            return;
        }

        const lineNumber = statement.range.start.line;
        this.coverageMap.set(lineNumber, coverageType);
        const parsed = Parser.parse(this.getFuncCallText(lineNumber, coverageType, statement)).ast.statements[0] as ExpressionStatement;
        this.astEditor.arraySplice(owner, key, 0, parsed);
        // store the statement in a set to avoid handling again after inserting statement above
        this.processedStatements.add(statement);
    }

    public addBrsAPIText(file: BrsFile, astEditor: Editor) {
        const astCodeToInject = Parser.parse(this.coverageBrsTemplate.replace(/\#ID\#/g, this.fileId.toString().trim())).ast.statements;
        astEditor.arrayPush(file.ast.statements, ...astCodeToInject);
    }

    private addStatement(statement: Statement, lineNumber?: number) {
        if (!this.executableLines.has(lineNumber)) {
            this.executableLines.set(lineNumber, statement);
        }
    }

    private getFuncCallText(lineNumber: number, lineType: CodeCoverageLineType, statement: Statement) {
        const funcId = this.getFunctionIdInFile(statement, ParseMode.BrighterScript);
        this.coverageMap.set(lineNumber, lineType);
        return `RBS_CC_${this.fileId}_reportLine("${lineNumber.toString().trim()}", ${lineType.toString().trim()}, ${funcId})`;
    }

    private getFunctionIdInFile(statement: Statement, parseMode: ParseMode) {
        let originalFunc: FunctionExpression = statement.findAncestor(isFunctionExpression);
        let func: FunctionExpression = originalFunc;

        let nameParts = [];
        while (func.parentFunction) {
            let index = func.parentFunction.childFunctionExpressions.indexOf(func);
            nameParts.unshift(`anon${index}`);
            func = func.parentFunction;
        }
        //get the index of this function in its parent
        nameParts.unshift(
            func.functionStatement.getName(parseMode)
        );

        const name = nameParts.join('$');

        if (!this.processedFunctions.has(originalFunc)) {
            this.processedFunctions.add(originalFunc);
            if (!this.functionMap[this.fileId]) {
                this.functionMap[this.fileId] = [];
            }

            this.functionMap[this.fileId].push(name);
        }

        return this.functionMap[this.fileId].indexOf(name);
    }
}
