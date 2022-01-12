/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BrsFile, ProgramBuilder, Statement, Expression, isIfStatement } from 'brighterscript';
import { createCall, createIntegerLiteral } from 'brighterscript';
import { createIdentifier, createStringLiteral, createToken, BinaryExpression, isForStatement, TokenKind } from 'brighterscript';
import { Position, WalkMode, createVisitor } from 'brighterscript';
import type { RooibosConfig } from './RooibosConfig';
import { RawCodeStatement } from './RawCodeStatement';
import { TranspileState } from 'brighterscript/dist/parser/TranspileState';
import { BrsTranspileState } from 'brighterscript/dist/parser/BrsTranspileState';
import { Range } from 'vscode-languageserver-types';
import { createVarExpression, getTokenText } from './Utils';
import { RawCodeExpression } from './RawCodeExpression';

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

    private coverageComponentBrsTemplate = `
function init()
  m.resolvedMap = {}
  m.top.observeField("entry", "onEntryChange")
  m.top.observeField("save", "onSave")

end function

function setExpectedMap()
  m.top.expectedMap = #EXPECTED_MAP#
end function

function setFilePathMap()
  m.top.filePathMap = #FILE_PATH_MAP#
end function

function onEntryChange()
entry = m.top.entry
  if entry <> invalid
    lineMap = m.resolvedMap[entry.f]

    if lineMap = invalid
      lineMap = {}
    end if
    lineMap[entry.l] = entry.r

    m.resolvedMap[entry.f] = lineMap
  end if
end function

function onSave()
  ? "saving data"
  m.top.resolvedMap = m.resolvedMap
  setExpectedMap()
  setFilePathMap()
end function
`;

    private coverageComponentXmlTemplate = `
<?xml version="1.0" encoding="UTF-8"?>
<component name="CodeCoverage"
           extends="ContentNode"
>
    <script type="text/brightscript" uri="CodeCoverage.brs" />
    <interface>
        <field id="entry" type="assocarray" />
        <field id="save" type="boolean" />
        <field id="expectedMap" type="assocarray" />
        <field id="resolvedMap" type="assocarray" />
        <field id="filePathMap" type="assocarray" />
    </interface>
</component>`;

    private coverageSupportTemplate = `
function RBS_ReportCodeCoverage() as void

  if m.global._rbs_ccn = invalid
    ? "There was no rooibos code coverage component - not generating coverage report"
    return
  end if
  ? ""
  ? "...Generating code coverage report"
  ? ""
  m.global._rbs_ccn.save = true
  cc = m.global._rbs_ccn
  hitFiles = []
  missFiles = []
  allLinesCount = 0
  allLinesHit = 0
  for each key in cc.expectedMap
    filename = cc.filePathMap[key]
    expectedCount = cc.expectedMap[key].count()
    allLinesCount += expectedCount
    if expectedCount > 0
      if cc.resolvedMap[key] <> invalid
        resolvedCount = cc.resolvedMap[key].count()
        allLinesHit += resolvedCount
        resolvedPercent = (resolvedCount / expectedCount) * 100
        hitFiles.push({percent:resolvedPercent, text:filename + ": " +str(resolvedPercent).trim() + "% (" + stri(resolvedCount).trim() + "/" + stri(expectedCount).trim() + ")"})
      else
        resolvedCount = 0
        resolvedPercent = 0
        missFiles.push(filename + ": MISS!")
      end if
    end if
  end for
  allLinesPercent = (allLinesHit / allLinesCount) * 100
  ? ""
  ? ""
  ? "+++++++++++++++++++++++++++++++++++++++++++"
  ? "Code Coverage Report"
  ? "+++++++++++++++++++++++++++++++++++++++++++"
  ? ""
  ? "Total Coverage: " ; str(allLinesPercent).trim() ; "% (" ; stri(allLinesHit).trim() ; "/" + stri(allLinesCount).trim() ; ")"
  ? "Files: " ; cc.resolvedMap.count(); "/" ; cc.expectedMap.count()
  ? ""
  ? "HIT FILES"
  ? "---------"
  hitFiles.SortBy("percent")
  for i = 0 to hitFiles.count() -1
    ? hitFiles[i].text
  end for
  ? ""
  ? "MISSED FILES"
  ? "------------"
  for i = 0 to missFiles.count() -1
    ? missFiles[i]
  end for

end function
`;

    constructor(builder: ProgramBuilder) {
        this.config = (builder.options as any).rooibos as RooibosConfig || {};
        this.fileId = 0;
        try {
        } catch (e) {
            console.log('Error:', e.stack);
        }
    }

    private config: RooibosConfig;
    private fileId: number;
    private filePathMap: Map<number, string>;
    private expectedCoverageMap: any;
    private executableLines: Map<number, Statement >;
    private transpileState: BrsTranspileState;
    private coverageMap: Map<number, number> ;

    public generateMetadata() {
        //DO when everythin is ran
        this.createCoverageComponent();
        this.createCoverageSupport();
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
                    (ifStatement as any).condition = new BinaryExpression(new RawCodeExpression(this.getFuncCallText(ds.condition.range.start.line, CodeCoverageLineType.branch)), createToken(TokenKind.And), (ifStatement as any).condition);
                    ifStatement = ifStatement.elseBranch as any;
                }
                let blockStatements = (ifStatement as any)?.statements as any[] ?? [];
                if (blockStatements?.length > 0) {
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                    let coverageStatement = new RawCodeStatement(this.getFuncCallText((ifStatement as any).range.start.line, CodeCoverageLineType.code));
                    blockStatements.splice(0, 0, [coverageStatement]);
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
                if (!isForStatement(parent)) {
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
        // if (!lineNumber) {
        //   if (true || !(statement instanceof IfStatement)) {
        //     lineNumber = statement.location.start.line - 1;
        //   } else {
        //     console.log('addStatement called with otherStatement, without a line number! - OtherStatements types must provide a line number');
        //   }
        // }
        if (!this.executableLines.has(lineNumber)) {
            this.executableLines.set(lineNumber, statement);
        } else {
            console.debug(`line was already registered`);
        }
    }

    private getFuncCallText(lineNumber: number, lineType: CodeCoverageLineType) {
        return `RBS_CC_${this.fileId}_reportLine(${lineNumber.toString().trim()}, ${lineType.toString().trim()})`;
    }

    /**
     * ADDITIONAL FRAMEWORK FILE SUPPORT
     */


    public createCoverageComponent() {
        //TODO move to file factory
        // //Write this out via program
        // let targetPath = path.resolve(this._program.options.rootDir);
        // let file = new File(path.resolve(path.join(targetPath), 'components'), 'components', 'CodeCoverage.xml', '.xml');
        // file.setFileContents(this.coverageComponentXmlTemplate);
        //`Writing to ${file.fullPath}`);
        // file.saveFileContents();

        // file = new File(path.resolve(path.join(targetPath, 'components')), 'components', 'CodeCoverage.brs', '.brs');
        // let template = this.coverageComponentBrsTemplate;
        // template = template.replace(/\#EXPECTED_MAP\#/g, JSON.stringify(this.expectedCoverageMap));
        // template = template.replace(/\#FILE_PATH_MAP\#/g, JSON.stringify(this.filePathMap));
        // file.setFileContents(template);
        //`Writing to ${file.fullPath}`);
        // file.saveFileContents();
    }

    public createCoverageSupport() {
        //TODO move to file factory
        // //write this out via program
        // let targetPath = path.resolve(this._program.options.rootDir);
        // let file = new File(path.resolve(path.join(targetPath), 'source'), 'source', 'CodeCoverageSupport.brs', '.brs');
        // file.setFileContents(this.coverageSupportTemplate);
        //`Writing to ${file.fullPath}`);
        // file.saveFileContents();
    }

}
