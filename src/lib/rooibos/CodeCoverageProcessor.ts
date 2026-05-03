/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { BrsFile, Editor, ExpressionStatement, FunctionExpression, Program, ProgramBuilder, Statement } from 'brighterscript';
import { Parser, WalkMode, createVisitor, BinaryExpression, createToken, TokenKind, GroupingExpression, isForStatement, isFunctionExpression, ParseMode, isFunctionStatement, isCallExpression, isVariableExpression, isIfStatement, isForEachStatement, isWhileStatement, isTryCatchStatement, isCatchStatement } from 'brighterscript';
import type { IfStatement, TryCatchStatement, CatchStatement, Expression, AssignmentStatement, CallExpression } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeExpression } from './RawCodeExpression';
import type { FileFactory } from './FileFactory';

export enum CodeCoverageLineType {
    noCode = 0,
    code = 1,
    condition = 2,
    branch = 3,
    function = 4
}

export class CodeCoverageProcessor {

    private coverageBrsTemplate = `
        function RBS_CC_#ID#_reportLine(lineNumber)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": #ID#, "l": lineNumber, "r": ${CodeCoverageLineType.code} }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
            _rbs_ccn.entry = { "f": #ID#, "l": lineNumber, "r": ${CodeCoverageLineType.code} }
                m._rbs_ccn = _rbs_ccn
                return true
            end if
            return true
        end function

        function RBS_CC_#ID#_reportBranch(blockId, branchId)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": #ID#, "bl": blockId, "br": branchId, "r": ${CodeCoverageLineType.branch} }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": #ID#, "bl": blockId, "br": branchId, "r": ${CodeCoverageLineType.branch} }
                m._rbs_ccn = _rbs_ccn
                return true
            end if
            return true
        end function

        function RBS_CC_#ID#_reportFunction(functionId)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": #ID#, "fn": functionId, "r": ${CodeCoverageLineType.function} }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": #ID#, "fn": functionId, "r": ${CodeCoverageLineType.function} }
                m._rbs_ccn = _rbs_ccn
                return true
            end if
            return true
        end function

        function RBS_CC_#ID#_branchValue(blockId, branchId, value)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": #ID#, "bl": blockId, "br": branchId, "r": ${CodeCoverageLineType.branch} }
                return value
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": #ID#, "bl": blockId, "br": branchId, "r": ${CodeCoverageLineType.branch} }
                m._rbs_ccn = _rbs_ccn
                return value
            end if
            return value
        end function
    `;

    constructor(builder: ProgramBuilder, fileFactory: FileFactory) {
        this.config = (builder.options as any).rooibos as RooibosConfig || {};
        this.functionMap = [];
        this.fileId = 0;
        this.fileFactory = fileFactory;
        this.processedFunctions = new Set<FunctionExpression>();
        this.baseCoverageReport = {
            files: []
        };
        try {
        } catch (e) {
            console.log('Error:', e.stack);
        }
    }

    private baseCoverageReport: CoverageMap;
    private config: RooibosConfig;
    private fileId: number;
    private blockId: number;
    private functionMap: Array<Array<string>>;
    private executableLines: Map<number, Statement>;
    private fileFactory: FileFactory;
    private processedStatements: Set<Statement>;
    private processedFunctions: Set<FunctionExpression>;
    private addedStatements: Set<Statement>;
    private astEditor: Editor;

    private foundLines: Array<LineCoverage>;
    private foundFunctions: Array<FunctionCoverage>;
    private foundBlocks: Array<BranchCoverage>;
    private pendingFunctionReports: Array<{ func: FunctionExpression; callText: string }>;
    /**
     * Queued reportLine insertions, applied after the walk completes. Inserting mid-visit via
     * arraySplice on the owner array breaks brighterscript's walker - after a splice it
     * re-reads owner[key] and finds the inserted node, then marks the original as processed
     * without descending into its children. Deferring lets the walker descend into expressions
     * (e.g. a ternary inside a return statement) before any structural mutation happens.
     */
    private pendingLineReports: Array<{ owner: any; statement: Statement; callText: string }>;
    /** Tracks the block.id and anchor line reserved for an IfStatement so its then/else branches share both. */
    private allocatedIfBlocks: Map<IfStatement, { blockId: number; line: number }>;
    /**
     * Tracks the block.id reserved for a TryCatchStatement so its try-branch and catch-branch
     * pair under one block. The CatchStatement is stored separately because the Block visitor
     * sees CatchStatement (not TryCatchStatement) as the parent when walking the catch body.
     */
    private allocatedTryBlocks: Map<TryCatchStatement | CatchStatement, { blockId: number; line: number }>;
    /** Tracks expressions we've already wrapped (e.g. ternary arms) so we don't double-wrap on re-visits. */
    private processedExpressions: Set<Expression>;

    public generateMetadata(isUsingCoverage: boolean, program: Program) {
        this.fileFactory.createCoverageComponent(program, this.baseCoverageReport);
    }

    public addCodeCoverage(file: BrsFile, astEditor: Editor) {
        if (this.config.isRecordingCodeCoverage) {
            this.blockId = 0;
            this._processFile(file, astEditor);
            this.fileId++;
        }
    }

    public _processFile(file: BrsFile, astEditor: Editor) {
        this.foundLines = [];
        this.foundFunctions = [];
        this.foundBlocks = [];

        this.executableLines = new Map<number, Statement>();
        this.processedStatements = new Set<Statement>();
        this.addedStatements = new Set<Statement>();
        this.pendingFunctionReports = [];
        this.pendingLineReports = [];
        this.allocatedIfBlocks = new Map();
        this.allocatedTryBlocks = new Map();
        this.processedExpressions = new Set();
        this.astEditor = astEditor;

        file.ast.walk(createVisitor({
            FunctionStatement: (statement) => {
                this.ensureFunctionTracked(statement, ParseMode.BrighterScript);
            },
            Block: (statement, parent, owner, key) => {
                if (isFunctionExpression(parent)) {
                    return;
                }

                const lineNumber = statement.range.start.line + 1;
                let blockId: number;
                let branchId: number;

                // Pair then/else blocks of an IfStatement under the same block.id so consumers
                // (genhtml, istanbul-reports) can render them as one branching decision with
                // multiple outcomes (the I/E badges in nyc-style HTML reports).
                if (isIfStatement(parent) && this.allocatedIfBlocks.has(parent)) {
                    const reserved = this.allocatedIfBlocks.get(parent)!;
                    blockId = reserved.blockId;
                    const blockEntry = this.foundBlocks.find(b => b.id === blockId)!;
                    branchId = blockEntry.branches.length;
                    // Both arms anchor to the if-statement's line so the I/E badge appears
                    // next to the `if` keyword in the rendered HTML, matching nyc's TS output.
                    blockEntry.branches.push({
                        id: branchId,
                        line: reserved.line,
                        totalHit: 0
                    });
                } else if ((isTryCatchStatement(parent) || isCatchStatement(parent)) && this.allocatedTryBlocks.has(parent)) {
                    const reserved = this.allocatedTryBlocks.get(parent)!;
                    blockId = reserved.blockId;
                    const blockEntry = this.foundBlocks.find(b => b.id === blockId)!;
                    branchId = blockEntry.branches.length;
                    // Both arms anchor to the try-statement's line so the I/E badge sits next
                    // to the `try` keyword.
                    blockEntry.branches.push({
                        id: branchId,
                        line: reserved.line,
                        totalHit: 0
                    });
                } else {
                    blockId = this.blockId++;
                    branchId = 0;
                    // For loop body blocks, anchor the branch to the loop statement's line
                    // (e.g. `for each ...`) rather than the first body line, so the I badge
                    // for "loop body never entered" lands on the loop keyword, matching the
                    // anchoring style of nyc/Istanbul TS reports.
                    let anchorLine = lineNumber;
                    if (isForStatement(parent) || isForEachStatement(parent) || isWhileStatement(parent)) {
                        anchorLine = parent.range.start.line + 1;
                    }
                    this.foundBlocks.push({
                        id: blockId,
                        isIfArm: false,
                        branches: [{
                            id: branchId,
                            line: anchorLine,
                            totalHit: 0
                        }]
                    });
                }

                const parsed = Parser.parse(this.getReportBranchHitFuncCallText(blockId, branchId, statement)).ast.statements[0] as ExpressionStatement;
                this.astEditor.addToArray(statement.statements, 0, parsed);
            },
            ForStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                ds.forToken.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: for`;
            },
            TryCatchStatement: (tryCatch, parent, owner, key) => {
                this.addStatement(tryCatch, tryCatch.range.start.line);
                // Prefix the `try` token with a reportLine call so the try line gets counted
                // at runtime. Done via token-text mutation (same pattern as ForStatement /
                // WhileStatement / ForEachStatement) rather than arraySplice; splicing the
                // owner array mid-visit causes the walker to re-read owner[key] and skip
                // the try-statement's children.
                tryCatch.tokens.try.text = `${this.getReportLineHitFuncCallText(tryCatch.range.start.line, CodeCoverageLineType.code, tryCatch)}: try`;
                // Reserve a single block.id covering the try and catch arms. Both Block visits
                // (for tryBranch and catchBranch) will discover their reservation here and
                // append to the same block, anchoring I/E badges at the `try` keyword line.
                const reservedId = this.blockId++;
                const reservation = {
                    blockId: reservedId,
                    line: tryCatch.range.start.line + 1
                };
                this.allocatedTryBlocks.set(tryCatch, reservation);
                if (tryCatch.catchStatement) {
                    this.allocatedTryBlocks.set(tryCatch.catchStatement, reservation);
                }
                this.foundBlocks.push({
                    id: reservedId,
                    // Treat try/catch like an if/else pair - both arms tracked, no synthetic
                    // implicit-arm needed. isIfArm=false skips the implicit-else synthesis.
                    isIfArm: false,
                    branches: []
                });
            },
            IfStatement: (ifStatement, parent, owner, key) => {
                this.addStatement(ifStatement, ifStatement.range.start.line);
                // Reserve a block.id for this if-statement; its then-branch and (optional)
                // else-branch will share it via the Block handler above. We also record the
                // if-statement's own line so paired branches anchor the I/E badge to the
                // `if` keyword rather than the first line of each branch's body.
                const reservedId = this.blockId++;
                this.allocatedIfBlocks.set(ifStatement, {
                    blockId: reservedId,
                    line: ifStatement.range.start.line + 1
                });
                this.foundBlocks.push({
                    id: reservedId,
                    isIfArm: true,
                    branches: []
                });
                const conditionWrap = new BinaryExpression(
                    new RawCodeExpression(this.getReportLineHitFuncCallText(ifStatement.condition.range.start.line, CodeCoverageLineType.condition, ifStatement)),
                    createToken(TokenKind.And),
                    new GroupingExpression({
                        left: createToken(TokenKind.LeftParen),
                        right: createToken(TokenKind.RightParen)
                    }, ifStatement.condition)
                );
                // Mark our synthetic AND as processed so the BinaryExpression visitor doesn't
                // try to wrap its operands - this And exists purely to fire reportLine before
                // the user's condition runs, not as a real branch decision.
                this.processedExpressions.add(conditionWrap);
                (ifStatement as any).condition = conditionWrap;

                // let blockStatements = ifStatement?.thenBranch?.statements;
                // if (blockStatements) {
                //     let coverageStatement = new RawCodeStatement(this.getReportLineHitFuncCallText(ifStatement.range.start.line, CodeCoverageLineType.branch, ifStatement));
                //     blockStatements.splice(0, 0, coverageStatement);
                // }

                // // Handle the else blocks
                // let elseBlock = ifStatement.elseBranch;
                // if (isBlock(elseBlock) && elseBlock.statements) {
                //     let coverageStatement = new RawCodeStatement(this.getReportLineHitFuncCallText(elseBlock.range.start.line - 1, CodeCoverageLineType.branch, elseBlock));
                //     elseBlock.statements.splice(0, 0, coverageStatement);
                // }

            },
            GotoStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            WhileStatement: (ds, parent, owner, key) => {
                ds.tokens.while.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: while`;
            },
            ReturnStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ForEachStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                ds.tokens.forEach.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: for each`;
            },
            ExitWhileStatement: (ds, parent, owner, key) => {

            },
            PrintStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            DottedSetStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            IndexedSetStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            IncrementStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            AssignmentStatement: (ds, parent, owner, key) => {
                if (!isForStatement(parent)) {
                    this.addStatement(ds, ds.range.start.line);
                    this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
                }

            },
            ExpressionStatement: (ds, parent, owner, key) => {
                if (isCallExpression(ds.expression) && isVariableExpression(ds.expression.callee) && ds.expression.callee.name.text.startsWith('RBS_CC_')) {
                    return;
                }

                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            BinaryExpression: (expr) => {
                // Only instrument logical-style and/or operators. BS uses these tokens for both
                // bitwise (integer) and logical (boolean) cases - we wrap unconditionally; the
                // wrap is semantically inert for bitwise (just records hits and returns the
                // value), and for logical it captures short-circuit because BS won't evaluate
                // the wrapped right side when the left short-circuits.
                if (expr.operator.kind !== TokenKind.And && expr.operator.kind !== TokenKind.Or) {
                    return;
                }
                if (this.processedExpressions.has(expr)) {
                    return;
                }
                this.processedExpressions.add(expr);

                const blockId = this.blockId++;
                this.foundBlocks.push({
                    id: blockId,
                    isIfArm: false,
                    branches: [
                        {
                            id: 0,
                            line: expr.left.range.start.line + 1,
                            column: expr.left.range.start.character,
                            endColumn: expr.left.range.end.character - 1,
                            totalHit: 0
                        },
                        {
                            id: 1,
                            line: expr.right.range.start.line + 1,
                            column: expr.right.range.start.character,
                            endColumn: expr.right.range.end.character - 1,
                            totalHit: 0
                        }
                    ]
                });

                const wrappedLeft = this.wrapBranchValue(blockId, 0, expr.left);
                const wrappedRight = this.wrapBranchValue(blockId, 1, expr.right);
                this.astEditor.setProperty(expr, 'left', wrappedLeft);
                this.astEditor.setProperty(expr, 'right', wrappedRight);
            },
            NullCoalescingExpression: (expr) => {
                if (this.processedExpressions.has(expr)) {
                    return;
                }
                this.processedExpressions.add(expr);

                // Same model as ternary: branch 0 = consequent (left side / `??`'s primary),
                // branch 1 = alternate (right side, only runs when consequent was nullish).
                // Wrapping both arms with branchValue: branch 0 fires every evaluation since
                // BS always evaluates the consequent to null-check it; branch 1 fires only
                // when alternate runs. The renderer flags the missed alternate in yellow,
                // which is the case worth catching.
                const blockId = this.blockId++;
                this.foundBlocks.push({
                    id: blockId,
                    isIfArm: false,
                    branches: [
                        {
                            id: 0,
                            line: expr.consequent.range.start.line + 1,
                            column: expr.consequent.range.start.character,
                            endColumn: expr.consequent.range.end.character - 1,
                            totalHit: 0
                        },
                        {
                            id: 1,
                            line: expr.alternate.range.start.line + 1,
                            column: expr.alternate.range.start.character,
                            endColumn: expr.alternate.range.end.character - 1,
                            totalHit: 0
                        }
                    ]
                });

                const wrappedConsequent = this.wrapBranchValue(blockId, 0, expr.consequent);
                const wrappedAlternate = this.wrapBranchValue(blockId, 1, expr.alternate);
                this.astEditor.setProperty(expr, 'consequent', wrappedConsequent);
                this.astEditor.setProperty(expr, 'alternate', wrappedAlternate);
            },
            TernaryExpression: (ternary) => {
                if (this.processedExpressions.has(ternary)) {
                    return;
                }
                this.processedExpressions.add(ternary);

                // Reserve a 2-arm block: branch 0 = consequent (truthy), branch 1 = alternate (falsy).
                // Anchor each arm to its own start line and column so the I/E badge lands right
                // before the missed arm in the rendered HTML, rather than at the start of the line.
                const blockId = this.blockId++;
                // Columns are 0-indexed (LSP convention) - matches what Istanbul's annotator
                // expects, no further conversion needed in the renderer. End columns are stored
                // inclusive (last character index) since Istanbul's annotator does `endCol + 1`
                // when computing the wrap range.
                this.foundBlocks.push({
                    id: blockId,
                    isIfArm: false,
                    branches: [
                        {
                            id: 0,
                            line: ternary.consequent.range.start.line + 1,
                            column: ternary.consequent.range.start.character,
                            endColumn: ternary.consequent.range.end.character - 1,
                            totalHit: 0
                        },
                        {
                            id: 1,
                            line: ternary.alternate.range.start.line + 1,
                            column: ternary.alternate.range.start.character,
                            endColumn: ternary.alternate.range.end.character - 1,
                            totalHit: 0
                        }
                    ]
                });

                // Wrap each arm with a branchValue helper call. The original sub-expressions are
                // grafted in as the third argument so the walker can still descend into them
                // (catches nested ternaries/expressions).
                const wrappedConsequent = this.wrapBranchValue(blockId, 0, ternary.consequent);
                const wrappedAlternate = this.wrapBranchValue(blockId, 1, ternary.alternate);
                this.astEditor.setProperty(ternary, 'consequent', wrappedConsequent);
                this.astEditor.setProperty(ternary, 'alternate', wrappedAlternate);
            }
        }), { walkMode: WalkMode.visitAllRecursive });

        // Apply queued reportFunction insertions now that the walk is finished. Doing this
        // during the walk would shift the function body's first statement and prevent the
        // walker from descending into that statement's children. See pendingFunctionReports above.
        for (const { func, callText } of this.pendingFunctionReports) {
            const parsed = Parser.parse(callText).ast.statements[0] as ExpressionStatement;
            this.astEditor.addToArray(func.body.statements, 0, parsed);
        }

        // Apply queued reportLine inserts. Look up each statement's current position in its
        // parent array because other queued inserts may have shifted it.
        for (const { owner, statement, callText } of this.pendingLineReports) {
            const idx = Array.isArray(owner) ? owner.indexOf(statement) : -1;
            if (idx < 0) {
                continue;
            }
            const parsed = Parser.parse(callText).ast.statements[0] as ExpressionStatement;
            this.astEditor.arraySplice(owner, idx, 0, parsed);
            this.addedStatements.add(parsed);
        }

        this.addBrsAPIText(file, astEditor);

        this.baseCoverageReport.files[this.fileId] = {
            sourceFile: file.pkgPath.replace('pkg:', '.').replace('\\', '/'),
            lines: this.foundLines.sort((a, b) => a.lineNumber - b.lineNumber),
            lineTotalFound: this.foundLines.length,
            lineTotalHit: 0,
            functions: this.foundFunctions.sort((a, b) => a.startLine - b.startLine),
            functionTotalFound: this.foundFunctions.length,
            functionTotalHit: 0,
            blocks: this.foundBlocks,
            branchTotalFound: this.foundBlocks.reduce((currentCount, block) => currentCount + block.branches.length, 0),
            branchTotalHit: 0
        };
    }

    /**
     * Builds a CallExpression of the form `RBS_CC_<fileId>_branchValue(blockId, branchId, original)`
     * where `original` is the user-written expression preserved as a sub-AST node. Done by
     * parsing a template assignment with a placeholder arg and swapping the placeholder for
     * the original expression - this keeps the original's AST intact so the walker descends
     * into it (e.g. nested ternaries get instrumented too).
     */
    private wrapBranchValue(blockId: number, branchId: number, original: Expression): Expression {
        const callText = `RBS_CC_${this.fileId}_branchValue(${blockId}, ${branchId}, __rbs_placeholder__)`;
        const stmt = Parser.parse(`__rbs_wrapped__ = ${callText}`).ast.statements[0] as AssignmentStatement;
        const call = stmt.value as CallExpression;
        call.args[2] = original;
        return call;
    }

    private convertStatementToCoverageStatement(statement: Statement, coverageType: CodeCoverageLineType, owner: any, key: any) {
        if (this.processedStatements.has(statement) || this.addedStatements.has(statement)) {
            return;
        }

        const lineNumber = statement.range.start.line;
        const callText = this.getReportLineHitFuncCallText(lineNumber, coverageType, statement);
        // Queue the splice; flushed after the walk so we don't disrupt the visitor descending
        // into this statement's children. owner is captured by reference; the statement's index
        // is recomputed at flush time since other deferred inserts may shift things.
        this.pendingLineReports.push({ owner, statement, callText });
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

    private addStatement(statement: Statement, lineNumber: number) {
        // BrighterScript ranges are 0-indexed; LCOV / Istanbul HTML renderers expect 1-indexed lines.
        const oneIndexed = lineNumber + 1;
        if (!this.executableLines.has(oneIndexed)) {
            this.executableLines.set(oneIndexed, statement);

            this.foundLines.push({
                lineNumber: oneIndexed,
                totalHit: 0
            });
        }
    }

    private getReportLineHitFuncCallText(lineNumber: number, lineType: CodeCoverageLineType, statement: Statement) {
        // Side effect: registers the containing function so its reportFunction call gets
        // queued for insertion after the walk. owner/key are kept on the signature for symmetry
        // with brighterscript's visitor handlers but unused here.
        this.ensureFunctionTracked(statement, ParseMode.BrighterScript);
        return `RBS_CC_${this.fileId}_reportLine(${lineNumber + 1})`;
    }

    private getReportBranchHitFuncCallText(blockId: number, branchId: number, statement: Statement) {
        this.ensureFunctionTracked(statement, ParseMode.BrighterScript);
        return `RBS_CC_${this.fileId}_reportBranch(${blockId}, ${branchId})`;
    }

    private getReportFunctionHitFuncCallText(functionId: number, statement: Statement) {
        return `RBS_CC_${this.fileId}_reportFunction(${functionId})`;
    }

    /**
     * Idempotently registers the FunctionExpression that contains this statement so its
     * reportFunction insertion gets queued for after the walk. Builds a stable name for
     * the function (using parent-function indices for nested anonymous expressions) so
     * each function is registered exactly once even when reached via multiple call sites.
     */
    private ensureFunctionTracked(statement: Statement, parseMode: ParseMode) {
        let originalFunc: FunctionExpression;
        if (isFunctionStatement(statement)) {
            originalFunc = statement.func;
        } else {
            originalFunc = statement.findAncestor(isFunctionExpression);
        }
        if (this.processedFunctions.has(originalFunc)) {
            return;
        }
        let func: FunctionExpression = originalFunc;

        let nameParts = [];
        while (func.parentFunction) {
            let index = func.parentFunction.childFunctionExpressions.indexOf(func);
            nameParts.unshift(`anon${index}`);
            func = func.parentFunction;
        }
        nameParts.unshift(func.functionStatement.getName(parseMode));
        const name = nameParts.join('$');

        this.processedFunctions.add(originalFunc);
        if (!this.functionMap[this.fileId]) {
            this.functionMap[this.fileId] = [];
        }
        // Defer the reportFunction insertion until after the walk completes.
        // brighterscript's walker re-reads owner[key] after the visitor returns; mutating
        // the function body's index 0 mid-visit makes it walk the inserted node and skip
        // the original child's subtree (e.g. if-statement's thenBranch/elseBranch).
        this.pendingFunctionReports.push({
            func: originalFunc,
            callText: this.getReportFunctionHitFuncCallText(this.functionMap[this.fileId].length, statement)
        });
        this.foundFunctions.push({
            name: name,
            startLine: originalFunc.range.start.line + 1,
            endLine: originalFunc.range.end.line + 1,
            totalHit: 0
        });
        this.functionMap[this.fileId].push(name);
    }
}


export interface CoverageMap {
    files: Array<FileCoverage>;
}

interface FileCoverage {
    sourceFile: string;
    lineTotalFound: number;
    lineTotalHit: number;
    lines: Array<LineCoverage>;
    functionTotalFound: number;
    functionTotalHit: number;
    functions: Array<FunctionCoverage>;
    branchTotalFound: number;
    branchTotalHit: number;
    blocks: Array<BranchCoverage>;
}

interface BranchCoverage {
    id: number;
    /**
     * True when this block was reserved by an IfStatement (rather than a loop body or else
     * standalone block). Used at lcov-write time in the BS runtime to synthesize an implicit
     * else arm for single-arm ifs, so the report can flag never-taken falsy paths.
     */
    isIfArm: boolean;
    branches: Array<{
        id: number;
        totalHit: number;
        line: number;
        /**
         * Start/end column of the arm (0-indexed, inclusive end). Set for expression-level
         * branches (ternary arms) where the renderer wraps the arm in a yellow `cbranch-no`
         * span when the arm's hit count is zero. Undefined for block-level branches where
         * the I/E badge alone is enough.
         */
        column?: number;
        endColumn?: number;
    }>;
}
interface FunctionCoverage {
    name: string;
    totalHit: number;
    startLine: number;
    endLine: number;
}

interface LineCoverage {
    lineNumber: number;
    totalHit: number;
}
