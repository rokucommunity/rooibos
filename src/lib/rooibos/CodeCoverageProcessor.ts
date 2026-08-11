/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Parser, WalkMode, createVisitor, BinaryExpression, Block, createToken, TokenKind, GroupingExpression, isForStatement, isFunctionExpression, ParseMode, isFunctionStatement, isMethodStatement, isCallExpression, isVariableExpression, isIfStatement, isWhileStatement, isBinaryExpression, isGroupingExpression, isUnaryExpression, isDottedGetExpression, isIndexedGetExpression, isCallfuncExpression, isTernaryExpression, isNullCoalescingExpression, isArrayLiteralExpression, isAALiteralExpression, isAAMemberExpression, isStatement } from 'brighterscript';
import type { AssignmentStatement, BrsFile, CallExpression, Editor, Expression, ExpressionStatement, FunctionExpression, FunctionStatement, IfStatement, Program, ProgramBuilder, Range, Statement } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeExpression } from './RawCodeExpression';
import type { FileFactory } from './FileFactory';
import * as fs from 'fs';
import * as path from 'path';

export enum CodeCoverageLineType {
    noCode = 0,
    code = 1,
    condition = 2,
    branch = 3,
    function = 4
}

/**
 * Empirically measured device limits (Roku Ultra, OS 15.3.5, confirmed by binary-search
 * sideload probing - see docs). The relevant compile error is &hae "Internal limit size
 * exceeded", which is raised PER EXPRESSION when one statement's expression holds too much
 * logical-operator/call complexity:
 *  - a plain `a or b or ...` chain compiles up to 29 operators
 *  - a flat or-chain of calls `f() or g() or ...` compiles up to ~22 terms
 *  - recursively NESTED wrapper calls (the old rooibos branch wrap) die at 8 terms
 * Statements-per-function, literals-per-function and call-nesting depth showed no limit
 * (50k+ / 100+ deep all compile), so statement-level insertions are effectively free.
 */
interface ExpressionStats {
    /** number of and/or operators in the subtree */
    logicalOps: number;
    /** number of call expressions in the subtree */
    calls: number;
    /** number of maximal same-operator runs (a `binary-expr` group in Istanbul terms) */
    runs: number;
    /** sum, over every and/or operator, of how many call-argument boundaries enclose it */
    logicalOpsInCalls: number;
    /** true when the subtree contains an anonymous function - blocks helper extraction */
    hasFunctionExpression: boolean;
}

/** Normalized logical tree used for helper-function extraction. Leaf nodes have no `op`. */
interface LogicalTreeNode {
    op?: 'and' | 'or';
    children?: LogicalTreeNode[];
    leaf?: Expression;
    range: Range;
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
    }

    /**
     * Default projected-complexity budget for one expression. The real device cap is ~29
     * "units"; the default leaves roughly 2x headroom for costs the estimator can't see
     * (operand complexity, wrap nesting introduced by enclosing instrumentation).
     */
    private static readonly DEFAULT_EXPRESSION_BUDGET = 16;
    /**
     * If/elseif chains longer than this get restructured (`else if` -> `else` + nested
     * `if`) every N arms so no single chain approaches the ~260-arm instrumented cap.
     */
    private static readonly DEFAULT_MAX_CHAIN_ARMS = 150;
    /** Compiled .brs files must stay under 2MiB (&hb9 at exactly 2048KB). */
    private static readonly DEFAULT_MAX_FILE_BYTES = 1900000;
    /**
     * Rough source-size multiplier applied when projecting a file's post-instrumentation
     * size (one reportLine call per executable statement roughly doubles a dense file).
     */
    private static readonly INSTRUMENTATION_BYTE_MULTIPLIER = 2.4;
    /** Bail out of helper extraction if the generated ladder would exceed this many lines. */
    private static readonly MAX_HELPER_LINES = 400;
    /** Max locals we're willing to pass into an extracted condition helper. */
    private static readonly MAX_HELPER_PARAMS = 16;

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
    /** Tracks expressions we've already wrapped (e.g. ternary arms) so we don't double-wrap on re-visits. */
    private processedExpressions: Set<Expression>;
    /** IfStatements that are the elseBranch of another IfStatement (i.e. `else if` arms). */
    private elseIfChildren: Set<IfStatement>;
    /** Condition helper functions generated this file, appended to the AST after the walk. */
    private pendingHelpers: Array<Statement>;
    private helperCounter: number;
    /** Range of the statement currently being extracted; used to clamp foreign-grafted expression ranges. */
    private ladderStatementRange: Range | undefined;
    /** Human-readable notes about instrumentation that was reshaped or skipped, printed per file. */
    private coverageWarnings: string[];
    /**
     * 'full' instruments lines, branches and functions. 'functionOnly' is the fallback for
     * files whose projected post-instrumentation size would break Roku's 2MiB file cap.
     */
    private fileMode: 'full' | 'functionOnly';

    private get expressionBudget(): number {
        return this.config.coverageMaxExpressionComplexity ?? CodeCoverageProcessor.DEFAULT_EXPRESSION_BUDGET;
    }

    private get maxChainArms(): number {
        return this.config.coverageMaxIfChainArms ?? CodeCoverageProcessor.DEFAULT_MAX_CHAIN_ARMS;
    }

    private get maxFileBytes(): number {
        return this.config.coverageMaxFileBytes ?? CodeCoverageProcessor.DEFAULT_MAX_FILE_BYTES;
    }

    public generateMetadata(isUsingCoverage: boolean, program: Program) {
        // coverage-off builds ship no coverage model JSON, and Rooibos.bs skips creating
        // the task node - the component definition itself still ships so bsc can
        // validate the createObject call against it
        if (!isUsingCoverage) {
            return;
        }
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
        this.processedExpressions = new Set();
        this.elseIfChildren = new Set();
        this.pendingHelpers = [];
        this.helperCounter = 0;
        this.coverageWarnings = [];
        this.astEditor = astEditor;

        // Roku refuses to load .brs files of 2MiB or more. Line/branch instrumentation
        // roughly doubles a dense file, so very large sources fall back to function-level
        // coverage rather than producing a package the device cannot sideload.
        const sourceBytes = file.fileContents?.length ?? 0;
        const projectedBytes = sourceBytes * CodeCoverageProcessor.INSTRUMENTATION_BYTE_MULTIPLIER;
        this.fileMode = projectedBytes > this.maxFileBytes ? 'functionOnly' : 'full';
        if (this.fileMode === 'functionOnly') {
            this.coverageWarnings.push(`source is ${sourceBytes} bytes and would exceed Roku's 2MiB compiled-file limit once instrumented; recording function coverage only for this file`);
        }

        file.ast.walk(createVisitor({
            FunctionStatement: (statement) => {
                this.ensureFunctionTracked(statement, ParseMode.BrighterScript);
            },
            // class methods dispatch as MethodStatement, not FunctionStatement - without
            // this key, functionOnly mode (which early-returns in every other handler)
            // records no functions at all for class-heavy files
            MethodStatement: (statement) => {
                this.ensureFunctionTracked(statement, ParseMode.BrighterScript);
            },
            Block: (statement, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                if (isFunctionExpression(parent)) {
                    return;
                }
                // Only if/else arms are branch-tracked, matching istanbul's TS instrumenter
                // (branches are: if, cond-expr, binary-expr, switch, default-arg). Loop bodies
                // and try/catch arms are NOT branches in istanbul - a never-entered body shows
                // up through statement coverage of its lines, exactly as it does in TS.
                if (!isIfStatement(parent) || !this.allocatedIfBlocks.has(parent)) {
                    return;
                }

                // Pair then/else blocks of an IfStatement under the same block.id so consumers
                // (genhtml, istanbul-reports) can render them as one branching decision with
                // multiple outcomes (the I/E badges in nyc-style HTML reports).
                const reserved = this.allocatedIfBlocks.get(parent)!;
                const blockId = reserved.blockId;
                const blockEntry = this.foundBlocks.find(b => b.id === blockId)!;
                const branchId = blockEntry.branches.length;
                // Inline arms (`if cond then <statement>`) get their clause's column range
                // recorded so host tooling can synthesize an Istanbul STATEMENT for the
                // clause - line-granular tracking can't see it (the if line itself ran),
                // but the arm's branch hit count is exactly the clause's execution count.
                // nyc paints the TS equivalent (`if (x) return y;`) red this way.
                const isInlineArm = statement.range.start.line === statement.range.end.line &&
                    statement.range.start.line + 1 === reserved.line;
                // Both arms anchor to the if-statement's line so the I/E badge appears
                // next to the `if` keyword in the rendered HTML, matching nyc's TS output.
                blockEntry.branches.push({
                    id: branchId,
                    line: reserved.line,
                    totalHit: 0,
                    ...(isInlineArm ? {
                        sc: statement.range.start.character,
                        ec: statement.range.end.character - 1
                    } : {})
                });

                const parsed = Parser.parse(this.getReportBranchHitFuncCallText(blockId, branchId, statement)).ast.statements[0] as ExpressionStatement;
                this.astEditor.addToArray(statement.statements, 0, parsed);
            },
            ForStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line);
                ds.forToken.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: for`;
            },
            TryCatchStatement: (tryCatch, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(tryCatch, tryCatch.range.start.line);
                // Prefix the `try` token with a reportLine call so the try line gets counted
                // at runtime. Done via token-text mutation (same pattern as ForStatement /
                // WhileStatement / ForEachStatement) rather than arraySplice; splicing the
                // owner array mid-visit causes the walker to re-read owner[key] and skip
                // the try-statement's children.
                tryCatch.tokens.try.text = `${this.getReportLineHitFuncCallText(tryCatch.range.start.line, CodeCoverageLineType.code, tryCatch)}: try`;
                // try/catch arms are deliberately NOT branch-tracked - istanbul's TS
                // instrumenter doesn't treat them as branches either; an unexercised catch
                // shows up through statement coverage of its body lines.
            },
            IfStatement: (ifStatement, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                // Restructure over-long elseif ladders before the walker descends into them.
                // The compiler's &hae if-table is per-chain (~270 arms plain / ~260 once the
                // arm bodies carry instrumentation), so `else if` becomes `else` + nested `if`
                // every maxChainArms arms, which starts a fresh chain with identical semantics.
                if (!this.elseIfChildren.has(ifStatement)) {
                    this.splitLongIfChain(ifStatement);
                }
                if (isIfStatement(ifStatement.elseBranch)) {
                    this.elseIfChildren.add(ifStatement.elseBranch);
                }

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

                // The if-line hit is normally reported by rewriting the condition to
                // `RBS_CC_X_reportLine(N) and (<condition>)`. That adds one operator and one
                // call to the condition's expression, so budget-check it against the &hae
                // expression-complexity cap first.
                const stats = this.analyzeExpression(ifStatement.condition);
                const flatWrapsFit = this.instrumentedComplexity(stats, { leafWraps: true, condWrap: false }) <= this.expressionBudget;
                const extractionPossible = !flatWrapsFit && !stats.hasFunctionExpression;
                const condWrapCost = this.instrumentedComplexity(stats, { leafWraps: flatWrapsFit, condWrap: true });
                let wrapFits = condWrapCost <= this.expressionBudget;
                if (!wrapFits && extractionPossible) {
                    // The wrap only fits if helper extraction first shrinks the condition
                    // to a single call, so extract NOW rather than betting on the walker's
                    // descent doing it - an applied wrap has no rollback path, and shipping
                    // it after a failed extraction would exceed the &hae cap the budget
                    // exists to guard. Hop through parens/not the same way isInBooleanContext
                    // does to find the logical root.
                    let extractionRoot: Expression = ifStatement.condition;
                    while (isGroupingExpression(extractionRoot) || (isUnaryExpression(extractionRoot) && extractionRoot.operator.kind === TokenKind.Not)) {
                        extractionRoot = isGroupingExpression(extractionRoot) ? extractionRoot.expression : extractionRoot.right;
                    }
                    if (isBinaryExpression(extractionRoot) && this.isLogicalBinary(extractionRoot)) {
                        wrapFits = this.tryExtractBooleanExpression(extractionRoot);
                    }
                }
                if (wrapFits) {
                    this.addStatement(ifStatement, ifStatement.range.start.line);
                    const conditionWrap = new BinaryExpression(
                        // Anchor to the if-statement's own range, NOT the condition's: other
                        // plugins (e.g. an is.* inliner) can graft replacement expressions into
                        // the condition that still carry ranges from a different source file,
                        // which would make this report a bogus line number.
                        new RawCodeExpression(this.getReportLineHitFuncCallText(ifStatement.range.start.line, CodeCoverageLineType.condition, ifStatement)),
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
                } else if (Array.isArray(owner)) {
                    // The condition is too hot to touch but this `if` sits in a statement list,
                    // so report its line with a plain statement inserted just before it.
                    this.addStatement(ifStatement, ifStatement.range.start.line);
                    this.convertStatementToCoverageStatement(ifStatement, CodeCoverageLineType.code, owner, key);
                } else {
                    // An `else if` arm has no statement slot to fall back to; leave its line
                    // out of the report rather than risking an &hae on the device.
                    this.coverageWarnings.push(`line ${ifStatement.range.start.line + 1}: else-if condition too complex to instrument; line hit not tracked`);
                }
            },
            GotoStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            WhileStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line);
                ds.tokens.while.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: while`;
            },
            ReturnStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ForEachStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line);
                ds.tokens.forEach.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds)}: for each`;
            },
            ExitWhileStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ExitForStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ContinueStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ThrowStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            PrintStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            DottedSetStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            IndexedSetStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            IncrementStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            AssignmentStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                if (!isForStatement(parent)) {
                    this.addStatement(ds, ds.range.start.line, true);
                    this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
                }

            },
            ExpressionStatement: (ds, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                if (isCallExpression(ds.expression) && isVariableExpression(ds.expression.callee) && ds.expression.callee.name.text.startsWith('RBS_CC_')) {
                    return;
                }

                this.addStatement(ds, ds.range.start.line, true);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            BinaryExpression: (expr, parent, owner, key) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                // Only instrument logical-style and/or operators. BS uses these tokens for both
                // bitwise (integer) and logical (boolean) cases - the branchValue wrap is
                // semantically inert for bitwise (just records hits and returns the value), and
                // for logical it captures short-circuit because BS won't evaluate the wrapped
                // right side when the left short-circuits.
                if (!this.isLogicalBinary(expr)) {
                    return;
                }
                if (this.processedExpressions.has(expr)) {
                    return;
                }
                // The walker visits outer expressions first, so an unprocessed logical binary
                // here is the root of a logical tree (inner same-op nodes get consumed below).
                const stats = this.analyzeExpression(expr);
                if (this.instrumentedComplexity(stats, { leafWraps: true, condWrap: false }) <= this.expressionBudget) {
                    this.applyFlatLeafWraps(expr);
                    return;
                }
                // Too complex to wrap in place without risking &hae on-device. When the value
                // feeds a boolean context (if/while condition) the whole tree can be extracted
                // into a generated helper that lowers it to a short-circuit ladder of simple
                // statements - full branch fidelity with no expression-size ceiling.
                if (process.env.RBS_CC_DEBUG) {
                    console.log(`[rbs-cc-debug] line ${expr.range.start.line + 1}: hasFn=${stats.hasFunctionExpression} boolCtx=${this.isInBooleanContext(expr)}`);
                }
                if (!stats.hasFunctionExpression && this.isInBooleanContext(expr) && this.tryExtractBooleanExpression(expr)) {
                    return;
                }
                this.markLogicalSubtreeProcessed(expr);
                this.coverageWarnings.push(`line ${expr.range.start.line + 1}: expression too complex to instrument for branch coverage; branch hits in it are not tracked`);
            },
            NullCoalescingExpression: (expr) => {
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                if (this.processedExpressions.has(expr)) {
                    return;
                }
                this.processedExpressions.add(expr);
                if (this.isForeignExpression(expr.consequent) || this.isForeignExpression(expr.alternate)) {
                    return;
                }

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
                            ...this.branchAnchor(expr.consequent),
                            totalHit: 0
                        },
                        {
                            id: 1,
                            ...this.branchAnchor(expr.alternate),
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
                if (this.fileMode === 'functionOnly') {
                    return;
                }
                if (this.processedExpressions.has(ternary)) {
                    return;
                }
                this.processedExpressions.add(ternary);
                if (this.isForeignExpression(ternary.consequent) || this.isForeignExpression(ternary.alternate)) {
                    return;
                }

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
                            ...this.branchAnchor(ternary.consequent),
                            totalHit: 0
                        },
                        {
                            id: 1,
                            ...this.branchAnchor(ternary.alternate),
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

        // Append any condition-helper functions generated by tryExtractBooleanExpression.
        for (const helper of this.pendingHelpers) {
            this.astEditor.arrayPush(file.ast.statements, helper);
            this.addedStatements.add(helper);
        }

        this.addBrsAPIText(file, astEditor);

        this.baseCoverageReport.files[this.fileId] = {
            sourceFile: file.pkgPath.replace('pkg:', '.').replace('\\', '/'),
            sourcePath: this.repoRelativeSourcePath(file.srcPath),
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

        for (const message of this.coverageWarnings) {
            console.log(`[rooibos coverage] ${file.pkgPath}: ${message}`);
        }
    }

    /** dir -> git repo root (or undefined when none found); avoids re-walking per file */
    private gitRootCache = new Map<string, string | undefined>();

    /**
     * Repo-relative path of the original source file, recorded so host-side tooling can map
     * pkg paths back to real repository paths (Coveralls SF rewriting, HTML source
     * resolution). Found by walking up from the file to the nearest `.git`. Undefined when
     * the file isn't inside a git checkout - consumers fall back to the pkg path.
     */
    private repoRelativeSourcePath(srcPath: string | undefined): string | undefined {
        if (!srcPath) {
            return undefined;
        }
        const root = this.findGitRoot(path.dirname(path.resolve(srcPath)));
        if (!root) {
            return undefined;
        }
        return path.relative(root, path.resolve(srcPath)).replace(/\\/g, '/');
    }

    private findGitRoot(startDir: string): string | undefined {
        const visited: string[] = [];
        let dir = startDir;
        let result: string | undefined;
        while (true) {
            const cached = this.gitRootCache.get(dir);
            if (cached !== undefined || this.gitRootCache.has(dir)) {
                result = cached;
                break;
            }
            visited.push(dir);
            if (fs.existsSync(path.join(dir, '.git'))) {
                result = dir;
                break;
            }
            const parent = path.dirname(dir);
            if (parent === dir) {
                break;
            }
            dir = parent;
        }
        for (const d of visited) {
            this.gitRootCache.set(d, result);
        }
        return result;
    }

    private isLogicalBinary(node: any): node is BinaryExpression {
        return isBinaryExpression(node) && (node.operator.kind === TokenKind.And || node.operator.kind === TokenKind.Or);
    }

    /**
     * Line/column anchor for a branch entry. Other plugins (e.g. fubo's is.* inliner) can
     * graft replacement expressions into a statement that still carry ranges from a
     * DIFFERENT source file; using those verbatim would put branch badges on nonsense
     * lines and could collide with real lines elsewhere in this file. When an expression's
     * range falls outside its containing statement, anchor to the statement's start line
     * and drop the column wrap.
     */
    private branchAnchor(expr: Expression): { line: number; column?: number; endColumn?: number } {
        const statement = expr.findAncestor<Statement>(isStatement);
        if (statement && this.isOutsideRange(expr, statement.range)) {
            return { line: statement.range.start.line + 1 };
        }
        // Column ranges are only meaningful for single-line expressions: a multi-line
        // arm's end column belongs to a different line, and pinning it to the start line
        // would hand Istanbul an inverted (end-before-start) span that garbles the HTML
        // highlight. Multi-line arms anchor by line/indent instead, like if-arm blocks.
        if (expr.range.start.line !== expr.range.end.line) {
            return { line: expr.range.start.line + 1 };
        }
        return {
            line: expr.range.start.line + 1,
            column: expr.range.start.character,
            endColumn: expr.range.end.character - 1
        };
    }

    /**
     * True when this expression's range lies outside its containing statement - the
     * fingerprint of code grafted in by another plugin (e.g. fubo's is.* inliner), whose
     * ranges point into a different source file. Branch entries for such code would render
     * as misplaced badges for logic the user cannot see in this file (nyc on TS reports
     * nothing for build-time-inlined helpers either), so branch instrumentation skips it.
     */
    private isForeignExpression(expr: Expression): boolean {
        const statement = expr.findAncestor<Statement>(isStatement);
        return !!statement && this.isOutsideRange(expr, statement.range);
    }

    private isOutsideRange(expr: Expression, range: Range): boolean {
        const line = expr.range.start.line;
        return line < range.start.line || line > range.end.line;
    }

    /**
     * Collects the complexity facts the &hae budget formula needs from one expression
     * subtree. Anonymous function bodies are NOT entered - they compile as separate
     * functions with their own limits.
     */
    private analyzeExpression(root: Expression): ExpressionStats {
        const stats: ExpressionStats = {
            logicalOps: 0,
            calls: 0,
            runs: 0,
            logicalOpsInCalls: 0,
            hasFunctionExpression: false
        };
        const visit = (node: any, callDepth: number, parentLogicalOp: TokenKind | null) => {
            if (!node || typeof node !== 'object') {
                return;
            }
            if (isFunctionExpression(node)) {
                stats.hasFunctionExpression = true;
                return;
            }
            if (this.isLogicalBinary(node)) {
                stats.logicalOps++;
                stats.logicalOpsInCalls += callDepth;
                if (parentLogicalOp !== node.operator.kind) {
                    stats.runs++;
                }
                visit(node.left, callDepth, node.operator.kind);
                visit(node.right, callDepth, node.operator.kind);
                return;
            }
            if (isCallExpression(node) || isCallfuncExpression(node)) {
                stats.calls++;
                visit(node.callee, callDepth, null);
                for (const arg of node.args ?? []) {
                    visit(arg, callDepth + 1, null);
                }
                return;
            }
            if (isGroupingExpression(node)) {
                // parens are transparent for complexity, but they do end a same-op run
                visit(node.expression, callDepth, null);
                return;
            }
            if (isBinaryExpression(node)) {
                visit(node.left, callDepth, null);
                visit(node.right, callDepth, null);
                return;
            }
            if (isUnaryExpression(node)) {
                visit(node.right, callDepth, null);
                return;
            }
            if (isDottedGetExpression(node)) {
                visit(node.obj, callDepth, null);
                return;
            }
            if (isIndexedGetExpression(node)) {
                visit(node.obj, callDepth, null);
                visit((node as any).index, callDepth, null);
                return;
            }
            if (isTernaryExpression(node)) {
                visit(node.test, callDepth, null);
                visit(node.consequent, callDepth, null);
                visit(node.alternate, callDepth, null);
                return;
            }
            if (isNullCoalescingExpression(node)) {
                visit(node.consequent, callDepth, null);
                visit(node.alternate, callDepth, null);
                return;
            }
            if (isArrayLiteralExpression(node)) {
                for (const element of node.elements) {
                    visit(element, callDepth, null);
                }
                return;
            }
            if (isAALiteralExpression(node)) {
                for (const element of node.elements) {
                    visit(element, callDepth, null);
                }
                return;
            }
            if (isAAMemberExpression(node)) {
                visit((node as any).value, callDepth, null);
            }
            // literals / variable refs / everything else: no complexity contribution
        };
        visit(root, 0, null);
        return stats;
    }

    /**
     * Projects the &hae complexity of an expression after instrumentation. Calibrated
     * against on-device measurements: plain operator chains die at ~29 units, so operators
     * cost 1, calls cost 0.3, and every operator nested inside a call argument costs an
     * extra 0.5 (nesting is what made the old recursive wrap die at 8 terms).
     */
    private instrumentedComplexity(stats: ExpressionStats, options: { leafWraps: boolean; condWrap: boolean }): number {
        const leaves = stats.logicalOps + stats.runs;
        const logicalOps = stats.logicalOps + (options.condWrap ? 1 : 0);
        const calls = stats.calls + (options.leafWraps ? leaves : 0) + (options.condWrap ? 1 : 0);
        const nestingPenalty = stats.logicalOpsInCalls + (options.leafWraps ? Math.max(0, stats.runs - 1) : 0);
        return logicalOps + (0.3 * calls) + (0.5 * nestingPenalty);
    }

    /**
     * Istanbul-style binary-expr instrumentation: collect the maximal run of same-operator
     * operands and wrap each LEAF in a branchValue call sharing one block id -
     * `bv(g,0,a) or bv(g,1,b) or bv(g,2,c)`. Wrap depth stays constant no matter how long
     * the chain is; the old recursive scheme nested each wrap inside the next one's
     * argument and hit the &hae expression cap at just 8 terms.
     */
    private applyFlatLeafWraps(root: BinaryExpression) {
        const opKind = root.operator.kind;
        const leaves: Array<{ holder: BinaryExpression; side: 'left' | 'right'; node: Expression }> = [];
        const collect = (bin: BinaryExpression) => {
            this.processedExpressions.add(bin);
            for (const side of ['left', 'right'] as const) {
                const child = bin[side];
                if (isBinaryExpression(child) && child.operator.kind === opKind) {
                    collect(child);
                } else {
                    leaves.push({ holder: bin, side: side, node: child });
                }
            }
        };
        collect(root);

        // Skip branch instrumentation when the run contains inliner-grafted operands - see
        // isForeignExpression. The run's binaries are already marked processed by collect(),
        // and line coverage (statement-anchored) is unaffected.
        if (leaves.some(leaf => this.isForeignExpression(leaf.node))) {
            return;
        }

        const blockId = this.blockId++;
        this.foundBlocks.push({
            id: blockId,
            isIfArm: false,
            branches: leaves.map((leaf, index) => ({
                id: index,
                ...this.branchAnchor(leaf.node),
                totalHit: 0
            }))
        });
        leaves.forEach((leaf, index) => {
            this.astEditor.setProperty(leaf.holder as any, leaf.side, this.wrapBranchValue(blockId, index, leaf.node));
        });
    }

    /** Marks every logical/ternary/?? node in the subtree processed so no visitor touches it. */
    private markLogicalSubtreeProcessed(root: Expression) {
        this.processedExpressions.add(root);
        root.walk(createVisitor({
            BinaryExpression: (e) => {
                if (this.isLogicalBinary(e)) {
                    this.processedExpressions.add(e);
                }
            },
            TernaryExpression: (e) => {
                this.processedExpressions.add(e);
            },
            NullCoalescingExpression: (e) => {
                this.processedExpressions.add(e);
            }
        }), { walkMode: WalkMode.visitExpressionsRecursive });
    }

    /**
     * True when the expression's value flows directly into an if/while condition (possibly
     * through parens, `not`, or our own synthetic reportLine and-wrap). Extraction is
     * limited to that context to keep the rewrite surface small and auditable. Note that
     * integer operands are legal here - `if 1 and 2` compiles and takes the FALSE branch
     * (bitwise and/or, measured on-device) - which is why the generated ladder folds each
     * operand with the native operator instead of relying on truthiness (see
     * emitBooleanLadderRoot).
     */
    private isInBooleanContext(node: Expression): boolean {
        let child: any = node;
        let ancestor: any = child.parent;
        while (ancestor) {
            if (isGroupingExpression(ancestor) && ancestor.expression === child) {
                child = ancestor;
                ancestor = ancestor.parent;
                continue;
            }
            if (isUnaryExpression(ancestor) && ancestor.operator.kind === TokenKind.Not && ancestor.right === child) {
                child = ancestor;
                ancestor = ancestor.parent;
                continue;
            }
            // our synthetic `reportLine(n) and (cond)` wrap is transparent
            if (this.isLogicalBinary(ancestor) && this.processedExpressions.has(ancestor) && ancestor.right === child) {
                child = ancestor;
                ancestor = ancestor.parent;
                continue;
            }
            if (isIfStatement(ancestor)) {
                return ancestor.condition === child;
            }
            if (isWhileStatement(ancestor)) {
                return ancestor.condition === child;
            }
            return false;
        }
        return false;
    }

    /**
     * Full-fidelity fallback for conditions too complex to wrap in place: move the logical
     * tree into a generated helper function where it is lowered to a ladder of trivial
     * single-leaf if-statements (statements are effectively unlimited on-device). The
     * original expression is replaced with a plain call to the helper. The ladder is
     * semantics-exact for boolean AND integer/float (bitwise/numeric) operands: values are
     * identical and every leaf is evaluated exactly when the device would evaluate it in
     * the original expression (see emitBooleanLadderRoot for the measured short-circuit
     * rule). Locals referenced by the expression are passed as parameters; `m` flows
     * through automatically because plain function calls keep the caller's `m` (the same
     * mechanism every injected RBS_CC_* helper already relies on).
     */
    private tryExtractBooleanExpression(root: BinaryExpression): boolean {
        const debug = process.env.RBS_CC_DEBUG ? (msg: string) => console.log(`[rbs-cc-debug] extract: ${msg}`) : undefined;
        const func = root.findAncestor<FunctionExpression>(isFunctionExpression);
        if (!func) {
            debug?.('no ancestor function');
            return false;
        }
        const localNames = this.collectLocalNames(func);
        const freeVars = this.collectFreeVariables(root, localNames);
        if (freeVars.length > CodeCoverageProcessor.MAX_HELPER_PARAMS) {
            debug?.(`too many free vars (${freeVars.length})`);
            return false;
        }
        const tree = this.normalizeLogicalTree(root);
        if (tree.op === undefined) {
            debug?.('tree normalized to a leaf');
            return false;
        }
        this.ladderStatementRange = root.findAncestor<Statement>(isStatement)?.range;

        // Generate the ladder body (records block/branch entries as it goes, so count the
        // rollback point first in case we bail on size).
        const foundBlocksMark = this.foundBlocks.length;
        const blockIdMark = this.blockId;
        const leafExpressions: Expression[] = [];
        const lines: string[] = [];
        this.emitBooleanLadderRoot(tree, leafExpressions, lines);
        if (lines.length > CodeCoverageProcessor.MAX_HELPER_LINES) {
            debug?.(`ladder too long (${lines.length} lines)`);
            this.foundBlocks.length = foundBlocksMark;
            this.blockId = blockIdMark;
            return false;
        }

        const helperName = `RBS_CC_${this.fileId}_cx${this.helperCounter++}`;
        const paramList = freeVars.join(', ');
        const helperSource = `function ${helperName}(${paramList})\n${lines.join('\n')}\nend function`;
        const parsed = Parser.parse(helperSource, { mode: ParseMode.BrighterScript }).ast.statements[0] as FunctionStatement;
        if (!parsed) {
            debug?.('helper failed to parse');
            this.foundBlocks.length = foundBlocksMark;
            this.blockId = blockIdMark;
            return false;
        }

        // Graft the original leaf expressions into the placeholder slots so they transpile
        // with all their original semantics (same technique as wrapBranchValue). Placeholders
        // appear either as a branchValue argument or as a bare assignment value (block-less
        // runs), so match the placeholder variable itself and replace it in its owner. Repeat
        // slots receive clones - they share the leaf's block/branch ids, which keeps reported
        // hits correct no matter which copy executes.
        const graftedIndexes = new Set<number>();
        parsed.walk(createVisitor({
            VariableExpression: (variable, parent, owner, key) => {
                if (!variable.name.text.startsWith('__rbs_ph_') || owner === undefined || key === undefined) {
                    return;
                }
                const index = parseInt(variable.name.text.slice('__rbs_ph_'.length), 10);
                const original = leafExpressions[index];
                owner[key] = graftedIndexes.has(index) ? (original as any).clone() : original;
                graftedIndexes.add(index);
            }
        }), { walkMode: WalkMode.visitAllRecursive });
        if (graftedIndexes.size !== leafExpressions.length) {
            debug?.(`graft mismatch (${graftedIndexes.size} of ${leafExpressions.length})`);
            this.foundBlocks.length = foundBlocksMark;
            this.blockId = blockIdMark;
            return false;
        }

        // Swap the original expression for `helperName(args...)`.
        const template = Parser.parse(`__rbs_extracted__ = ${helperName}(${paramList})`).ast.statements[0] as AssignmentStatement;
        if (!this.replaceExpression(root, template.value)) {
            debug?.('could not replace expression in parent');
            this.foundBlocks.length = foundBlocksMark;
            this.blockId = blockIdMark;
            return false;
        }

        this.pendingHelpers.push(parsed);
        this.markLogicalSubtreeProcessed(root);
        return true;
    }

    /** Every local name in scope in the given function: parameters plus all assignment targets. */
    private collectLocalNames(func: FunctionExpression): Set<string> {
        const names = new Set<string>();
        for (const param of func.parameters ?? []) {
            names.add(param.name.text.toLowerCase());
        }
        func.body.walk(createVisitor({
            AssignmentStatement: (s) => {
                names.add(s.name.text.toLowerCase());
            },
            ForEachStatement: (s: any) => {
                const item = s.item?.text ?? s.tokens?.item?.text;
                if (item) {
                    names.add(item.toLowerCase());
                }
            },
            CatchStatement: (s: any) => {
                const exceptionVar = s.exceptionVariable?.text ?? s.tokens?.exceptionVariable?.text;
                if (exceptionVar) {
                    names.add(exceptionVar.toLowerCase());
                }
            },
            IncrementStatement: (s: any) => {
                if (isVariableExpression(s.value)) {
                    names.add(s.value.name.text.toLowerCase());
                }
            }
        }), { walkMode: WalkMode.visitStatementsRecursive });
        return names;
    }

    /**
     * Variables the expression reads that are locals of the enclosing function (these must
     * be passed into the extraction helper). Non-local names - global functions, enums,
     * consts, namespaces - resolve identically inside the helper because it lives in the
     * same file. `m` is excluded: plain calls keep the caller's `m`.
     */
    private collectFreeVariables(root: Expression, localNames: Set<string>): string[] {
        const names: string[] = [];
        const seen = new Set<string>();
        root.walk(createVisitor({
            VariableExpression: (variable) => {
                const text = variable.name.text;
                const lower = text.toLowerCase();
                if (lower === 'm' || !localNames.has(lower) || seen.has(lower)) {
                    return;
                }
                seen.add(lower);
                names.push(text);
            }
        }), { walkMode: WalkMode.visitExpressionsRecursive });
        return names;
    }

    /**
     * Flattens a logical expression into op-runs. Parens around a same-op subchain are
     * flattened too (safe: short-circuit evaluation order is unchanged for associative
     * same-op grouping); different-op subtrees become child nodes.
     */
    private normalizeLogicalTree(expr: Expression): LogicalTreeNode {
        let node: Expression = expr;
        while (isGroupingExpression(node)) {
            node = node.expression;
        }
        if (this.isLogicalBinary(node)) {
            const binary = node;
            const op = binary.operator.kind === TokenKind.And ? 'and' : 'or';
            const children: LogicalTreeNode[] = [];
            const gather = (candidate: Expression) => {
                let inner: Expression = candidate;
                while (isGroupingExpression(inner)) {
                    inner = inner.expression;
                }
                if (this.isLogicalBinary(inner) && ((inner.operator.kind === TokenKind.And ? 'and' : 'or') === op)) {
                    gather(inner.left);
                    gather(inner.right);
                } else {
                    children.push(this.normalizeLogicalTree(inner));
                }
            };
            gather(binary.left);
            gather(binary.right);
            return { op: op, children: children, range: binary.range };
        }
        return { leaf: node, range: node.range };
    }

    /**
     * Emits the helper's body: the logical tree is evaluated into a single reused result
     * variable, one leaf per statement. Each step folds the operand in with the NATIVE
     * operator (`__rbs_r = __rbs_r and <leaf>`), never a bare reassignment, so the value of
     * __rbs_r is exact for booleans (logical) AND integers/floats (bitwise/numeric:
     * `1 and 2` must stay 0, not the truthiness of the last operand). The guard ifs between
     * operands replicate the device's own short-circuit rule, which is decided purely by
     * the LEFT operand's type (measured on-device 2026-08-10): a boolean false/true -
     * intrinsic Boolean or boxed roBoolean alike - short-circuits an and/or-run and the
     * right operand is never evaluated regardless of its type, while an integer or float
     * left operand ALWAYS evaluates the right operand, even when the result is already
     * determined (`0 and f()` still calls f). Hence the guard
     * `(type(__rbs_r) <> "Boolean" and type(__rbs_r) <> "roBoolean") or [not] __rbs_r`:
     * non-boolean accumulators never skip, boolean ones skip exactly when the runtime would.
     */
    private emitBooleanLadderRoot(tree: LogicalTreeNode, leafExpressions: Expression[], lines: string[]) {
        this.emitEval(tree, null, leafExpressions, lines, '    ', 0);
        lines.push('    return __rbs_r');
    }

    /**
     * Emits statements that leave `node`'s value in __rbs_r. `entryMark` is the (block,
     * branch) slot recording that evaluation reached this operand of the parent run - for
     * leaves the branchValue wrap itself records it, for sub-runs a bare reportBranch does.
     * `depth` names the per-nesting-level temp (`__rbs_t<depth>`) that holds the parent
     * run's accumulated value across a sub-run's evaluation.
     */
    private emitEval(node: LogicalTreeNode, entryMark: { blockId: number; branchId: number } | null, leafExpressions: Expression[], lines: string[], indent: string, depth: number) {
        if (node.op === undefined) {
            const valueText = entryMark
                ? this.ladderLeafCall(entryMark.blockId, entryMark.branchId, node.leaf, leafExpressions)
                : this.ladderPlainLeaf(node.leaf, leafExpressions);
            lines.push(`${indent}__rbs_r = ${valueText}`);
            return;
        }
        if (entryMark) {
            lines.push(`${indent}RBS_CC_${this.fileId}_reportBranch(${entryMark.blockId}, ${entryMark.branchId})`);
        }
        const children = node.children;
        // Runs containing inliner-grafted operands get no block - branch entries for code
        // the user cannot see in this file would render as misplaced badges.
        const blockEligible = !children.some(child => this.isForeignLadderNode(child));
        const blockId = blockEligible ? this.allocateLadderBlock(children) : -1;
        const markFor = (index: number) => (blockEligible ? { blockId: blockId, branchId: index } : null);
        this.emitEval(children[0], markFor(0), leafExpressions, lines, indent, depth);
        for (let i = 1; i < children.length; i++) {
            lines.push(node.op === 'and'
                ? `${indent}if (type(__rbs_r) <> "Boolean" and type(__rbs_r) <> "roBoolean") or __rbs_r`
                : `${indent}if (type(__rbs_r) <> "Boolean" and type(__rbs_r) <> "roBoolean") or not __rbs_r`);
            const innerIndent = `${indent}    `;
            const child = children[i];
            if (child.op === undefined) {
                const mark = markFor(i);
                const valueText = mark
                    ? this.ladderLeafCall(mark.blockId, mark.branchId, child.leaf, leafExpressions)
                    : this.ladderPlainLeaf(child.leaf, leafExpressions);
                lines.push(`${innerIndent}__rbs_r = __rbs_r ${node.op} ${valueText}`);
            } else {
                // Sub-run: park the accumulated value, evaluate the sub-run into __rbs_r,
                // then fold with the native operator (temp is consumed before any sibling
                // at this depth saves into it again, so per-depth naming is collision-free).
                lines.push(`${innerIndent}__rbs_t${depth} = __rbs_r`);
                this.emitEval(child, markFor(i), leafExpressions, lines, innerIndent, depth + 1);
                lines.push(`${innerIndent}__rbs_r = __rbs_t${depth} ${node.op} __rbs_r`);
            }
        }
        for (let i = 1; i < children.length; i++) {
            lines.push(`${indent}end if`);
        }
    }

    /** One coverage block per op-run, one branch per operand - same shape flat wraps produce. */
    private allocateLadderBlock(children: LogicalTreeNode[]): number {
        const blockId = this.blockId++;
        this.foundBlocks.push({
            id: blockId,
            isIfArm: false,
            branches: children.map((child, index) => {
                if (child.leaf) {
                    return { id: index, ...this.branchAnchor(child.leaf), totalHit: 0 };
                }
                // op-run child: clamp its (possibly inliner-grafted) range to the statement
                // being extracted, same rule as branchAnchor
                const statementRange = this.ladderStatementRange;
                const childLine = child.range.start.line;
                if (statementRange && (childLine < statementRange.start.line || childLine > statementRange.end.line)) {
                    return { id: index, line: statementRange.start.line + 1, totalHit: 0 };
                }
                // multi-line runs get no column range, same rule as branchAnchor
                if (childLine !== child.range.end.line) {
                    return { id: index, line: childLine + 1, totalHit: 0 };
                }
                return {
                    id: index,
                    line: childLine + 1,
                    column: child.range.start.character,
                    endColumn: child.range.end.character - 1,
                    totalHit: 0
                };
            })
        });
        return blockId;
    }

    private ladderLeafCall(blockId: number, branchId: number, leaf: Expression, leafExpressions: Expression[]): string {
        const index = leafExpressions.length;
        leafExpressions.push(leaf);
        return `RBS_CC_${this.fileId}_branchValue(${blockId}, ${branchId}, __rbs_ph_${index}__)`;
    }

    /** Placeholder without a branchValue wrap - used for leaves whose run has no block. */
    private ladderPlainLeaf(leaf: Expression, leafExpressions: Expression[]): string {
        const index = leafExpressions.length;
        leafExpressions.push(leaf);
        return `__rbs_ph_${index}__`;
    }

    /** True when a ladder node (leaf or sub-run) carries an inliner-grafted foreign range. */
    private isForeignLadderNode(node: LogicalTreeNode): boolean {
        if (node.leaf) {
            return this.isForeignExpression(node.leaf);
        }
        const statementRange = this.ladderStatementRange;
        if (!statementRange) {
            return false;
        }
        const line = node.range.start.line;
        return line < statementRange.start.line || line > statementRange.end.line;
    }


    /** Replaces `target` with `replacement` in target's parent, wherever it is referenced. */
    private replaceExpression(target: Expression, replacement: Expression): boolean {
        const parent: any = target.parent;
        if (!parent) {
            return false;
        }
        for (const key of ['expression', 'condition', 'left', 'right', 'value', 'obj', 'index', 'test', 'consequent', 'alternate']) {
            if (parent[key] === target) {
                this.astEditor.setProperty(parent, key, replacement);
                return true;
            }
        }
        if (Array.isArray(parent.args)) {
            const index = parent.args.indexOf(target);
            if (index >= 0) {
                this.astEditor.setProperty(parent.args, index, replacement);
                return true;
            }
        }
        return false;
    }

    /**
     * The &hae if-table is per contiguous elseif chain (~270 arms plain, ~260 instrumented,
     * measured on-device). Long generated ladders get restructured every maxChainArms arms:
     * `else if c` becomes `else : if c`, which is semantically identical but starts a new
     * chain. The walker hasn't descended into the elseBranch yet when the chain root is
     * visited, so the restructure is safe mid-walk; the nested if is later visited as a
     * fresh chain root and re-splits if the remainder is still too long.
     */
    private splitLongIfChain(chainRoot: IfStatement) {
        let arms = 1;
        let current: IfStatement = chainRoot;
        while (isIfStatement(current.elseBranch)) {
            arms++;
            if (arms > this.maxChainArms) {
                const rest = current.elseBranch;
                this.astEditor.setProperty(current as any, 'elseBranch', new Block([rest], rest.range));
                return;
            }
            current = current.elseBranch;
        }
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
        this.pendingLineReports.push({ owner: owner, statement: statement, callText: callText });
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

    /**
     * Registers an executable line. When `includeSpan` is set and the statement continues
     * onto later lines (multi-line call args, AA literals...), the entry carries the end
     * line so the HTML report can paint the whole statement, matching how nyc paints
     * multi-line TS statements. Only simple statements opt in - compound statements
     * (if/for/while/try) span their bodies, whose lines have entries of their own.
     */
    private addStatement(statement: Statement, lineNumber: number, includeSpan = false) {
        // BrighterScript ranges are 0-indexed; LCOV / Istanbul HTML renderers expect 1-indexed lines.
        const oneIndexed = lineNumber + 1;
        if (!this.executableLines.has(oneIndexed)) {
            this.executableLines.set(oneIndexed, statement);

            const entry: LineCoverage = {
                lineNumber: oneIndexed,
                totalHit: 0
            };
            const endLine = statement.range.end.line + 1;
            if (includeSpan && endLine > oneIndexed) {
                entry.el = endLine;
            }
            this.foundLines.push(entry);
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
        if (isFunctionStatement(statement) || isMethodStatement(statement)) {
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

export interface FileCoverage {
    sourceFile: string;
    /**
     * Repo-relative path of the original source file (posix separators), e.g.
     * `core/src/components/Foo.bs`. Written at build time so host-side tooling can rewrite
     * pkg paths to real repository paths (Coveralls needs SF paths that match git).
     * Undefined when the source file was not inside a git checkout.
     */
    sourcePath?: string;
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
        /**
         * Column range (0-indexed, inclusive end) of an INLINE if/else arm's clause - e.g.
         * `return x` in `if cond then return x`. Host tooling synthesizes an Istanbul
         * statement from this range with the arm's branch hit count, so a never-taken
         * inline clause paints red exactly like nyc paints the TS equivalent. Compact
         * names: the model rides close to Roku's 2MiB per-file boundary.
         */
        sc?: number;
        ec?: number;
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
    /**
     * End line (1-indexed, inclusive) for multi-line simple statements. Emitted as a
     * custom `RBSSPAN:` lcov extension so the HTML renderer paints the whole statement.
     */
    el?: number;
}
