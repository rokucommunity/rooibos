import type { BrsFile, Editor, ExpressionStatement, Program, ProgramBuilder, Statement } from 'brighterscript';
import { Parser, WalkMode, createVisitor, BinaryExpression, createToken, TokenKind, GroupingExpression, isForStatement, isBlock, isExpressionStatement, isCallExpression, util, InternalWalkMode } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeStatement } from './RawCodeStatement';
import { RawCodeExpression } from './RawCodeExpression';
import type { FileFactory } from './FileFactory';
import { RooibosLogPrefix } from '../utils/Diagnostics';

export enum CodeCoverageLineType {
    noCode = 0,
    code = 1,
    condition = 2,
    branch = 3,
    conditionalCompile = 4
}

export class CodeCoverageProcessor {

    private coverageBrsTemplate = `
        function RBS_CC_#ID#_reportLine(lineNumber, reportType = 1)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "l": lineNumber, "r": reportType }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "l": lineNumber, "r": reportType }
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
        this.fileId = 0;
        this.fileFactory = fileFactory;
        try {
        } catch (e) {
            builder.logger.error(RooibosLogPrefix, 'Error:', (e as Error).stack);
        }
    }

    private config: RooibosConfig;
    private fileId: number;
    private filePathMap: any;
    private expectedCoverageMap: any;
    private executableLines: Map<number, Statement>;
    private coverageMap: Map<number, number>;
    private fileFactory: FileFactory;
    private processedStatements: Set<Statement>;
    private addedStatements: Set<Statement>;
    private astEditor: Editor;

    public generateMetadata(program: Program) {
        return this.fileFactory.createCoverageComponent(program, this.expectedCoverageMap, this.filePathMap);
    }

    public addCodeCoverage(file: BrsFile, astEditor: Editor) {
        if (this.config.isRecordingCodeCoverage) {
            this._processFile(file, astEditor);
        }
    }

    public _processFile(file: BrsFile, astEditor: Editor) {
        this.fileId++;
        this.coverageMap = new Map<number, number>();
        this.executableLines = new Map<number, Statement>();
        this.processedStatements = new Set<Statement>();
        this.addedStatements = new Set<Statement>();
        this.astEditor = astEditor;
        file.program.logger.info(RooibosLogPrefix, 'Processing file for code coverage:', this.fileId, file.pkgPath);

        file.ast.walk(createVisitor({
            ForStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                ds.tokens.for.text = `${this.getFuncCallText(ds.location.range.start.line, CodeCoverageLineType.code)}: for`;
            },
            IfStatement: (ifStatement, parent, owner, key) => {
                this.addStatement(ifStatement);
                (ifStatement as any).condition = new BinaryExpression({
                    left: new RawCodeExpression(this.getFuncCallText(ifStatement.condition.location.range.start.line, CodeCoverageLineType.condition)),
                    operator: createToken(TokenKind.And),
                    right: new GroupingExpression({
                        leftParen: createToken(TokenKind.LeftParen),
                        rightParen: createToken(TokenKind.RightParen),
                        expression: ifStatement.condition
                    })
                });

                let blockStatements = ifStatement?.thenBranch?.statements;
                if (blockStatements) {
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText(ifStatement.location.range.start.line, CodeCoverageLineType.branch));
                    blockStatements.splice(0, 0, coverageStatement);
                }

                // Handle the else blocks
                let elseBlock = ifStatement.elseBranch;
                if (isBlock(elseBlock) && elseBlock.statements) {
                    let startRangeLine = elseBlock.location.range.start.line;
                    if (elseBlock.statements.length > 0) {
                        // if the else block has statements, then the coverage statement should be inserted before the first statement
                        startRangeLine -= 1;
                    }
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText(startRangeLine, CodeCoverageLineType.branch));
                    elseBlock.statements.splice(0, 0, coverageStatement);
                }

            },
            GotoStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            WhileStatement: (ds, parent, owner, key) => {
                ds.tokens.while.text = `${this.getFuncCallText(ds.location.range.start.line, CodeCoverageLineType.code)}: while`;
            },
            ReturnStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ForEachStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                ds.tokens.forEach.text = `${this.getFuncCallText(ds.location.range.start.line, CodeCoverageLineType.code)}: for each`;
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
            AugmentedAssignmentStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ExpressionStatement: (ds, parent, owner, key) => {
                this.addStatement(ds);
                //bsc's class transpiler assumes a `super()` call sits at index 0 of the constructor body, and
                //injects field initializers immediately after it. Inserting our coverage statement *before*
                //`super()` would shift it off index 0, causing field initializers to be emitted before the
                //`super()` call. So for `super()` we insert coverage *after* the call instead.
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key, this.isSuperCall(ds));
            },
            ConditionalCompileStatement: (ccStmt, parent, owner, key) => {
                this.addStatement(ccStmt);

                let blockStatements = ccStmt.thenBranch?.statements;
                if (blockStatements) {
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText(ccStmt.location.range.start.line, CodeCoverageLineType.conditionalCompile));
                    blockStatements.splice(0, 0, coverageStatement);
                }

                // Handle the else blocks
                let elseBlock = ccStmt.elseBranch;
                if (isBlock(elseBlock) && elseBlock.statements) {
                    let startRangeLine = elseBlock.location.range.start.line;
                    if (elseBlock.statements.length > 0) {
                        // if the else block has statements, then the coverage statement should be inserted before the first statement
                        startRangeLine -= 1;
                    }
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText(startRangeLine, CodeCoverageLineType.conditionalCompile));
                    elseBlock.statements.splice(0, 0, coverageStatement);
                }
            }
            // eslint-disable-next-line no-bitwise
        }), { walkMode: WalkMode.visitAllRecursive | InternalWalkMode.visitFalseConditionalCompilationBlocks });

        const coverageMapObject = {};
        for (let key of this.coverageMap.keys()) {
            coverageMapObject[key] = this.coverageMap.get(key);
        }
        this.expectedCoverageMap[this.fileId.toString().trim()] = coverageMapObject;
        this.filePathMap[this.fileId] = file.pkgPath;
        this.addBrsAPIText(file, astEditor);
    }

    /**
     * Is this statement a call to `super()`? (i.e. the parent-constructor call in a derived class constructor)
     */
    private isSuperCall(statement: Statement) {
        return isExpressionStatement(statement) &&
            isCallExpression(statement.expression) &&
            util.findBeginningVariableExpression(statement.expression.callee as any)?.tokens?.name?.text?.toLowerCase() === 'super';
    }

    /**
     * Insert a coverage-tracking statement adjacent to the given statement.
     * When `insertAfter` is true, the coverage statement is inserted *after* the given statement rather than before it.
     */
    private convertStatementToCoverageStatement(statement: Statement, coverageType: CodeCoverageLineType, owner: any, key: any, insertAfter = false) {
        if (this.processedStatements.has(statement) || this.addedStatements.has(statement)) {
            return;
        }

        const lineNumber = statement.location.range.start.line;
        this.coverageMap.set(lineNumber, coverageType);
        const parsed = Parser.parse(this.getFuncCallText(lineNumber, coverageType)).ast.statements[0] as ExpressionStatement;
        this.addedStatements.add(parsed);
        this.astEditor.arraySplice(owner, insertAfter ? key + 1 : key, 0, parsed);
        // store the statement in a set to avoid handling again after inserting statement above
        this.processedStatements.add(statement);
    }

    public addBrsAPIText(file: BrsFile, astEditor: Editor) {
        const astCodeToInject = Parser.parse(this.coverageBrsTemplate.replace(/\#ID\#/g, this.fileId.toString().trim())).ast.statements;
        astEditor.arrayPush(file.ast.statements, ...astCodeToInject);
        for (let statement of astCodeToInject) {
            this.addedStatements.add(statement);
        }
    }

    private addStatement(statement: Statement, lineNumber?: number) {
        if (!this.executableLines.has(lineNumber)) {
            this.executableLines.set(lineNumber, statement);
        }
    }

    private getFuncCallText(lineNumber: number, lineType: CodeCoverageLineType) {
        this.coverageMap.set(lineNumber, lineType);
        return `RBS_CC_${this.fileId}_reportLine("${lineNumber.toString().trim()}", ${lineType.toString().trim()})`;
    }
}
