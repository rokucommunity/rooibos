/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import type { BrsFile, Editor, ExpressionStatement, FunctionExpression, Identifier, Program, ProgramBuilder, Statement } from 'brighterscript';
import { Parser, WalkMode, createVisitor, BinaryExpression, createToken, TokenKind, GroupingExpression, isForStatement, isBlock, isFunctionExpression, ParseMode, isFunctionStatement, isCallExpression, isVariableExpression } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeStatement } from './RawCodeStatement';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
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
                _rbs_ccn.entry = { "f": "#ID#", "l": lineNumber, "r": ${CodeCoverageLineType.code} }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
            _rbs_ccn.entry = { "f": "#ID#", "l": lineNumber, "r": ${CodeCoverageLineType.code} }
                m._rbs_ccn = _rbs_ccn
                return true
            end if
            return true
        end function

        function RBS_CC_#ID#_reportBranch(blockId, branchId)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "bl": blockId, "br": branchId, "r": ${CodeCoverageLineType.branch} }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "bl": blockId, "br": branchId, "r": ${CodeCoverageLineType.branch} }
                m._rbs_ccn = _rbs_ccn
                return true
            end if
            return true
        end function

        function RBS_CC_#ID#_reportFunction(functionId)
            _rbs_ccn = m._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "fn": functionId, "r": ${CodeCoverageLineType.function} }
                return true
            end if

            _rbs_ccn = m?.global?._rbs_ccn
            if _rbs_ccn <> invalid
                _rbs_ccn.entry = { "f": "#ID#", "fn": functionId, "r": ${CodeCoverageLineType.function} }
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

    private foundLines: Array<LineCoverage>;
    private foundFunctions: Array<FunctionCoverage>;
    private foundBlocks: Array<BranchCoverage>;

    public generateMetadata(isUsingCoverage: boolean, program: Program) {
        this.fileFactory.createCoverageComponent(program, this.expectedCoverageMap, this.filePathMap, this.functionMap);
    }

    public addCodeCoverage(file: BrsFile, astEditor: Editor) {
        if (this.config.isRecordingCodeCoverage) {
            this.transpileState = new BrsTranspileState(file);
            this._processFile(file, astEditor);
            this.fileId++;
        }
    }

    public _processFile(file: BrsFile, astEditor: Editor) {
        this.foundLines = [];
        this.foundFunctions = [];
        this.foundBlocks = [];

        this.coverageMap = new Map<number, number>();
        this.executableLines = new Map<number, Statement>();
        this.processedStatements = new Set<Statement>();
        this.astEditor = astEditor;

        file.ast.walk(createVisitor({
            FunctionStatement: (statement, parent, owner, key) => {
                this.getFunctionIdInFile(statement, ParseMode.BrighterScript, owner, key);
            },
            ForStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                ds.forToken.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds, owner, key)}: for`;
            },
            IfStatement: (ifStatement, parent, owner, key) => {
                this.addStatement(ifStatement, ifStatement.range.start.line);
                (ifStatement as any).condition = new BinaryExpression(
                    new RawCodeExpression(this.getReportLineHitFuncCallText(ifStatement.condition.range.start.line, CodeCoverageLineType.condition, ifStatement, owner, key)),
                    createToken(TokenKind.And),
                    new GroupingExpression({
                        left: createToken(TokenKind.LeftParen),
                        right: createToken(TokenKind.RightParen)
                    }, ifStatement.condition)
                );

                let blockStatements = ifStatement?.thenBranch?.statements;
                if (blockStatements) {
                    let coverageStatement = new RawCodeStatement(this.getReportLineHitFuncCallText(ifStatement.range.start.line, CodeCoverageLineType.branch, ifStatement, owner, key));
                    blockStatements.splice(0, 0, coverageStatement);
                }

                // Handle the else blocks
                let elseBlock = ifStatement.elseBranch;
                if (isBlock(elseBlock) && elseBlock.statements) {
                    let coverageStatement = new RawCodeStatement(this.getReportLineHitFuncCallText(elseBlock.range.start.line - 1, CodeCoverageLineType.branch, elseBlock, owner, key));
                    elseBlock.statements.splice(0, 0, coverageStatement);
                }

            },
            GotoStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);

            },
            WhileStatement: (ds, parent, owner, key) => {
                ds.tokens.while.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds, owner, key)}: while`;
            },
            ReturnStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                this.convertStatementToCoverageStatement(ds, CodeCoverageLineType.code, owner, key);
            },
            ForEachStatement: (ds, parent, owner, key) => {
                this.addStatement(ds, ds.range.start.line);
                ds.tokens.forEach.text = `${this.getReportLineHitFuncCallText(ds.range.start.line, CodeCoverageLineType.code, ds, owner, key)}: for each`;
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
            }
        }), { walkMode: WalkMode.visitAllRecursive });

        const coverageMapObject = {};
        for (let key of this.coverageMap.keys()) {
            coverageMapObject[key] = this.coverageMap.get(key);
        }
        this.expectedCoverageMap[this.fileId.toString().trim()] = coverageMapObject;
        this.filePathMap[this.fileId] = file.pkgPath;
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
        console.log(this.baseCoverageReport);
    }

    private convertStatementToCoverageStatement(statement: Statement, coverageType: CodeCoverageLineType, owner: any, key: any) {
        if (this.processedStatements.has(statement)) {
            return;
        }

        const lineNumber = statement.range.start.line;
        this.coverageMap.set(lineNumber, coverageType);
        const parsed = Parser.parse(this.getReportLineHitFuncCallText(lineNumber, coverageType, statement, owner, key)).ast.statements[0] as ExpressionStatement;
        this.astEditor.arraySplice(owner, key, 0, parsed);
        // store the statement in a set to avoid handling again after inserting statement above
        this.processedStatements.add(statement);
    }

    public addBrsAPIText(file: BrsFile, astEditor: Editor) {
        const astCodeToInject = Parser.parse(this.coverageBrsTemplate.replace(/\#ID\#/g, this.fileId.toString().trim())).ast.statements;
        astEditor.arrayPush(file.ast.statements, ...astCodeToInject);
    }

    private addStatement(statement: Statement, lineNumber: number) {
        if (!this.executableLines.has(lineNumber)) {
            this.executableLines.set(lineNumber, statement);

            this.foundLines.push({
                lineNumber: lineNumber,
                totalHit: 0
            });
        }
    }

    private getReportLineHitFuncCallText(lineNumber: number, lineType: CodeCoverageLineType, statement: Statement, owner: any, key: any) {
        const funcId = this.getFunctionIdInFile(statement, ParseMode.BrighterScript, owner, key);
        this.coverageMap.set(lineNumber, lineType);
        return `RBS_CC_${this.fileId}_reportLine(${lineNumber})`;
    }

    private getReportBranchHitFuncCallText(blockId: number, branchId: number, statement: Statement, owner: any, key: any) {
        const funcId = this.getFunctionIdInFile(statement, ParseMode.BrighterScript, owner, key);
        return `RBS_CC_${this.fileId}_reportBranch(${blockId}, ${branchId})`;
    }

    private getReportFunctionHitFuncCallText(functionId: number, statement: Statement) {
        return `RBS_CC_${this.fileId}_reportFunction(${functionId})`;
    }

    private getFunctionIdInFile(statement: Statement, parseMode: ParseMode, owner: any, key: any) {
        let originalFunc: FunctionExpression;
        if (isFunctionStatement(statement)) {
            originalFunc = statement.func;
        } else {
            originalFunc = statement.findAncestor(isFunctionExpression);
        }
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

            const parsed = Parser.parse(this.getReportFunctionHitFuncCallText(this.functionMap[this.fileId].length, statement)).ast.statements[0] as ExpressionStatement;
            this.astEditor.addToArray(originalFunc.body.statements, 0, parsed);

            this.foundFunctions.push({
                name: name,
                startLine: originalFunc.range.start.line,
                endLine: originalFunc.range.end.line,
                totalHit: 0
            });
            this.functionMap[this.fileId].push(name);
        }

        return this.functionMap[this.fileId].indexOf(name);
    }
}


interface CoverageMap {
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
    id: string;
    branches: Array<{
        id: number;
        totalHit: number;
        line: number;
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

function createCovMap(files: Array<FileCoverage>) {

    let report = '';

    let covrageMap: CoverageMap = {
        files: []
    };

    for (const file of files) {
        report += `TN:\n`;
        report += `SF:${file.sourceFile}\n`;
        report += `VER:\n`;

        // Add all the found functions for the file
        for (const func of file.functions) {
            report += `FN:${func.startLine},${func.endLine},${func.name}\n`;
        }

        // Write function related data
        for (const func of file.functions) {
            if (func.totalHit > 0) {
                report += `FNDA:${func.totalHit},${func.name}\n`;
            }
        }

        report += `FNF:${file.functionTotalFound}\n`;
        report += `FNH:${file.functionTotalHit}\n`;

        // Write branch related data
        for (const block of file.blocks) {
            for (const branch of block.branches) {
                if (branch.totalHit > 0) {
                    report += `BRDA:${branch.line},${block.id},${branch.id},${branch.totalHit}\n`;
                }
            }
        }

        report += `BRF:${file.branchTotalFound}\n`;
        report += `BRH:${file.branchTotalHit}\n`;

        // Write the per line related data
        for (const line of file.lines) {
            report += `DA:${line.lineNumber},${line.totalHit}`;
        }

        report += `LF:${file.lineTotalFound}\n`;
        report += `LH:${file.lineTotalHit}\n`;
        report += `end_of_record\n`;
    }
}

