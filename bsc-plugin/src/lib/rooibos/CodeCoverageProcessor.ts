/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BrsFile,
  CompilerPlugin,
  FileObj,
  Program,
  ProgramBuilder,
  SourceObj,
  Util,
  XmlFile
} from 'brighterscript';

import * as path from 'path';

import {
  AALiteralExpression, ArrayLiteralExpression, AssignmentStatement, BinaryExpression, CallExpression,
  DottedGetExpression, DottedSetStatement, Expression, ExpressionStatement, ForEachStatement, ForStatement, FunctionExpression,
  FunctionStatement, IfStatement, IndexedSetStatement, LiteralExpression, PrintStatement, ReturnStatement, Statement, VariableExpression,
  WhileStatement
} from 'brighterscript/dist/parser';

import { RooibosConfig } from './RooibosConfig';
import { CodeCoverageLineType } from './CodeCoverageType';

export class CodeCoverageProcessor {

  constructor(builder: ProgramBuilder) {
    this._config = (builder.options as any).rooibos as RooibosConfig || {};
    this._builder = builder;
    this._fileId = 0;
    this._filePathMap = new Map<number, string>();
    this._expectedCoverageMap = {};
    try {
      // this._coverageBrsTemplate = fs.readFileSync(path.join(__dirname, './CodeCoverageTemplate.brs'), 'utf8');
      // this._coverageComponentBrsTemplate = fs.readFileSync(path.join(__dirname, './CodeCoverage.brs'), 'utf8');
      // this._coverageComponentXmlTemplate = fs.readFileSync(path.join(__dirname, './CodeCoverage.xml'), 'utf8');
      // this._coverageSupportTemplate = fs.readFileSync(path.join(__dirname, './CodeCoverageSupport.brs'), 'utf8');
    } catch (e) {
      // console.log('Error:', e.stack);
    }
  }

  private _builder: ProgramBuilder;
  private _config: RooibosConfig;
  private _fileId: number;
  private _coverageBrsTemplate: string;
  private _coverageComponentBrsTemplate: string;
  private _coverageComponentXmlTemplate: string;
  private _filePathMap: Map<number, string>;
  private _expectedCoverageMap: any;
  private _coverageSupportTemplate: any;
  private visitableLines: Map<number, Statement>;

  public generateMetadata() {
    //DO when everythin is ran
    this.createCoverageComponent();
    this.createCoverageSupport();
  }

  public addCodeCoverage(file: BrsFile) {
    //not yet supported
    if (false && this._config.isRecordingCodeCoverage) {
      this._processFile(file);
    }
    //if matches glob
    // this._processFile(file);
    //
  }

  public _processFile(file: BrsFile) {
    // this._fileId++;
    // let fileContents = '';
    // let lines = file.getFileContents().split(/\r?\n/);
    // let coverageMap: Map<number, number> = new Map<number, number>();
    // this.visitableLines = new Map<number, Statement>();
    // this.getVisitableLinesForStatements(file.ast);
    // //TODO - walks the ast
    // for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
    //   let line = lines[lineNumber];
    //   let statement = this.visitableLines.get(lineNumber);
    //   let coverageType = CodeCoverageLineType.noCode;
    //   if (statement) {
    //     if (statement instanceof IfStatement) {
    //       let conditionStartPos = statement.condition.range.start.character;
    //       let conditionEndPos = statement.condition.range.end.character;
    //       let funcCall = this.getFuncCallText(lineNumber, CodeCoverageLineType.condition);
    //       let conditionText = line.substr(conditionStartPos, conditionEndPos - conditionStartPos);
    //       let restofLineText = line.substring(conditionEndPos);
    //       line = `${line.substr(0, conditionStartPos)} ${funcCall} and (${conditionText}) ${restofLineText}`;
    //       coverageType = CodeCoverageLineType.condition;
    //     } else if (statement instanceof IfStatement) {
    //       // let conditionStartPos = statement.condition.location.start.column;
    //       // let conditionEndPos = statement.condition.location.end.column;
    //       // let funcCall = this.getFuncCallText(lineNumber, CodeCoverageLineType.condition);
    //       // let conditionText = line.substr(conditionStartPos, conditionEndPos - conditionStartPos);
    //       // let restofLineText = line.substring(conditionEndPos);
    //       // line = `${line.substr(0, conditionStartPos)} ${funcCall} and (${conditionText}) ${restofLineText}`;
    //       // coverageType = CodeCoverageLineType.condition;
    //     } else {
    //       //all types that can be prefixed with the funcall and a colon (i.e for, while, return foreach, assign)
    //       let funcCall = this.getFuncCallText(lineNumber, CodeCoverageLineType.code);
    //       line = `${funcCall}: ${line}`;
    //       coverageType = CodeCoverageLineType.code;
    //     }
    //   } else {
    //    `could not ascertain symbol type for line "${line} - ignoring`);
    //   }

    //   if (!line.endsWith('\n')) {
    //     line += '\n';
    //   }
    //   fileContents += line;
    //   if (coverageType > CodeCoverageLineType.noCode) {
    //     coverageMap.set(lineNumber, coverageType);
    //   }
    // }
    // this._expectedCoverageMap[this._fileId.toString().trim()] = Array.from(coverageMap);
    // this._filePathMap[this._fileId] = file.pkgUri;
    // fileContents += this.getBrsAPIText();
    // file.setFileContents(fileContents);
    //`Writing to ${file.fullPath}`);
    // file.saveFileContents();
  }

  public getBrsAPIText(): string {
    let template = this._coverageBrsTemplate.replace(/\#ID\#/g, this._fileId.toString().trim());
    return template;
  }

  public createCoverageComponent() {
    // //Write this out via program
    // let targetPath = path.resolve(this._program.options.rootDir);
    // let file = new File(path.resolve(path.join(targetPath), 'components'), 'components', 'CodeCoverage.xml', '.xml');
    // file.setFileContents(this._coverageComponentXmlTemplate);
    //`Writing to ${file.fullPath}`);
    // file.saveFileContents();

    // file = new File(path.resolve(path.join(targetPath, 'components')), 'components', 'CodeCoverage.brs', '.brs');
    // let template = this._coverageComponentBrsTemplate;
    // template = template.replace(/\#EXPECTED_MAP\#/g, JSON.stringify(this._expectedCoverageMap));
    // template = template.replace(/\#FILE_PATH_MAP\#/g, JSON.stringify(this._filePathMap));
    // file.setFileContents(template);
    //`Writing to ${file.fullPath}`);
    // file.saveFileContents();
  }

  public createCoverageSupport() {
    // //write this out via program
    // let targetPath = path.resolve(this._program.options.rootDir);
    // let file = new File(path.resolve(path.join(targetPath), 'source'), 'source', 'CodeCoverageSupport.brs', '.brs');
    // file.setFileContents(this._coverageSupportTemplate);
    //`Writing to ${file.fullPath}`);
    // file.saveFileContents();
  }

  private getFuncCallText(lineNumber: number, lineType: CodeCoverageLineType) {
    return `RBS_CC_${this._fileId}_reportLine(${lineNumber.toString().trim()}, ${lineType.toString().trim()})`;
  }

  private getVisitableLinesForStatements(statements: ReadonlyArray<Statement>) {
    //Walk the AST
    // for (let statement of statements) {
    //   if (statement instanceof FunctionStatement) {
    //     this.getVisitableLinesForStatements(statement.func.body.statements);
    //   } else if (statement instanceof AssignmentStatement
    //     || statement instanceof DottedSetStatement
    //     || statement instanceof IndexedSetStatement
    //   ) {
    //     this.addStatement(statement);
    //     this.getVisitableLinesForExpression([statement.value]);
    //   } else if (statement instanceof IfStatement) {
    //     this.addStatement(statement);
    //     if (statement.thenBranch) {
    //       this.getVisitableLinesForStatements(statement.thenBranch.statements);
    //     }
    //     if (statement.elseIfs) {
    //       for (let elseIfStatement of statement.elseIfs) {
    //         this.getVisitableLinesForStatements(elseIfStatement.thenBranch.statements);
    //         this.addStatement(new ElseIfStatement(elseIfStatement.condition), elseIfStatement.elseIfToken.range.start.line);
    //       }
    //     }
    //     if (statement.elseBranch) {
    //       this.getVisitableLinesForStatements(statement.elseBranch.statements);
    //     }
    //   } else if (statement instanceof ForStatement
    //     || statement instanceof ForEachStatement
    //     || statement instanceof WhileStatement) {

    //     this.addStatement(statement);
    //     this.getVisitableLinesForStatements(statement.body.statements);
    //   } else if (statement instanceof ExpressionStatement) {
    //     this.addStatement(statement);
    //     this.getVisitableLinesForExpression([statement.expression]);
    //   } else if (statement instanceof AssignmentStatement
    //     || statement instanceof PrintStatement
    //     || statement instanceof ReturnStatement
    //   ) {
    //     this.addStatement(statement);
    //   } else {
    //    `unknown statement type`);
    //   }
    // }
  }

  private addStatement(statement: Statement, lineNumber?: number) {
    // if (!lineNumber) {
    //   lineNumber = statement.range.start.line - 1;
    // }
    // if (!this.visitableLines.has(lineNumber)) {
    //   this.visitableLines.set(lineNumber, statement);
    // } else {
    //   `line was already registered`);
    // }
  }

  private getVisitableLinesForExpression(expressions: Expression[]) {
    //TODOD - walk the expression
    //   for (let expression of expressions) {
    //     if (expression instanceof AALiteralExpression) {
    //       this.getVisitableLinesForExpression(expression.elements.map((e) => null));
    //     } else if (expression instanceof ArrayLiteralExpression) {
    //       this.getVisitableLinesForExpression(expression.elements);
    //     } else if (expression instanceof CallExpression) {
    //       this.getVisitableLinesForExpression(expression.args);
    //     } else if (expression instanceof BinaryExpression) {
    //       this.getVisitableLinesForExpression([expression.left]);
    //       this.getVisitableLinesForExpression([expression.right]);
    //     } else if (expression instanceof FunctionExpression) {
    //       this.getVisitableLinesForStatements(expression.body.statements);
    //     } else if (expression instanceof LiteralExpression
    //       || expression instanceof VariableExpression
    //       || expression instanceof DottedGetExpression) {
    //       'known non-visitable expression: ' + expression.constructor.name);
    //     } else {
    //       `unknown expression`);
    //     }
    //   }
    return [];
  }

  private getCodeCoverageTemplate(): string {
    return '';
    //     function RBS_CC_#ID#_reportLine(lineNumber, reportType = 1)
    //   if m.global = invalid
    //     '? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
    //     return true
    //   else
    //     if m._rbs_ccn = invalid
    //      '? "Coverage maps are not created - creating now"
    //       if m.global._rbs_ccn = invalid
    //         '? "Coverage maps are not created - creating now"
    //           m.global.addFields({
    //             "_rbs_ccn": createObject("roSGnode", "CodeCoverage")
    //           })
    //       end if
    //       m._rbs_ccn = m.global._rbs_ccn
    //      end if
    //   end if

    //   m._rbs_ccn.entry = {"f":"#ID#", "l":stri(lineNumber), "r":reportType}
    //   return true
    // end function
  }
}
