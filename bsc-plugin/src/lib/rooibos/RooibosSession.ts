import * as path from 'path';
import * as fs from 'fs-extra';

import { BrsFile, ClassStatement, FunctionStatement, IfStatement, NamespaceStatement, ParseMode, Program, ProgramBuilder, TokenKind } from 'brighterscript';

import { RooibosConfig } from './RooibosConfig';
import { SessionInfo } from './RooibosSessionInfo';
import { TestSuiteBuilder } from './TestSuiteBuilder';
import { changeClassMethodBody, createIfStatement, createVarExpression } from './Utils';
import { RawCodeStatement } from './RawCodeStatement';
import { FileFactory } from './FileFactory';
import { TestSuite } from './TestSuite';
import { diagnosticErrorNoMainFound } from '../utils/Diagnostics';

// eslint-disable-next-line
const pkg = require('../../../package.json');

export class RooibosSession {
  constructor(builder: ProgramBuilder, fileFactory: FileFactory) {
    this.fileFactory = fileFactory;
    this._config = builder.options ? (builder.options as any).rooibos as RooibosConfig || {} : {};
    this._builder = builder;
    this._suiteBuilder = new TestSuiteBuilder(this);
    this.reset();
  }

  private fileFactory: FileFactory;
  private _builder: ProgramBuilder;
  private readonly _config: RooibosConfig;
  private _suiteBuilder: TestSuiteBuilder;

  public sessionInfo: SessionInfo;

  public reset() {
    this.sessionInfo = new SessionInfo();
  }

  public updateSessionStats() {
    this.sessionInfo.updateInfo();
  }

  public processFile(file: BrsFile): boolean {
    let testSuites = this._suiteBuilder.processFile(file);
    return testSuites.length > 0;
  }

  public addLaunchHook() {
    let mainFunc = null;
    let files = this._builder.program.getScopeByName('source').getOwnFiles();
    for (let file of files) {
      mainFunc = (file as BrsFile).parser.references.functionStatements.find((f) => f.name.text.toLowerCase() === 'main');
      if (mainFunc) {
        mainFunc.func.body.statements.splice(0, 0, new RawCodeStatement(`
  Rooibos_init()
        `));
        break;
      }
    }
    if (!mainFunc) {
      if (files.length > 0) {
        diagnosticErrorNoMainFound(files[0]);
      }
    }
  }

  public addTestRunnerMetadata() {
    let runtimeConfig = this._builder.program.getFileByPkgPath('source/rooibos/RuntimeConfig.bs');
    if (runtimeConfig) {
      let classStatement = ((runtimeConfig as BrsFile).ast.statements[0] as NamespaceStatement).body.statements[0] as ClassStatement;
      this.updateRunTimeConfigFunction(classStatement);
      this.updateVersionTextFunction(classStatement);
      this.updateClassLookupFunction(classStatement);
      this.updateGetAllTestSuitesNames(classStatement);
      this.createIgnoredTestsInfoFunction(classStatement);
    }
  }

  public updateRunTimeConfigFunction(classStatement: ClassStatement) {
    let method = classStatement.methods.find((m) => m.name.text === 'getRuntimeConfig');
    if (method) {
      method.func.body.statements.push(new RawCodeStatement(`
    return {
      "failFast": ${this._config.failFast ? 'true' : 'false'}
      "logLevel": ${this._config.logLevel ?? 0}
      "showOnlyFailures": ${this._config.showOnlyFailures ? 'true' : 'false'}
      "lineWidth": ${this._config.lineWidth || 60}
      "printLcov": ${this._config.printLcov ? 'true' : 'false'}
      "port": "${this._config.port || 'invalid'}"
    }`));
    }
  }

  public updateVersionTextFunction(classStatement: ClassStatement) {
    let method = classStatement.methods.find((m) => m.name.text === 'getVersionText');
    if (method) {
      method.func.body.statements.push(new RawCodeStatement(`return "${pkg.version}"`));
    }
  }

  public updateClassLookupFunction(classStatement: ClassStatement) {
    let method = classStatement.methods.find((m) => m.name.text === 'getTestSuiteClassWithName');
    if (method) {
      let text = `
      if false
        ? "noop"
      `;
      for (let suite of this.sessionInfo.testSuitesToRun) {
        text += `
        else if name = "${suite.name}"
          return ${suite.classStatement.getName(ParseMode.BrightScript)}
        `;
      }
      text += `
      end if`;
      method.func.body.statements.push(new RawCodeStatement(text));
    }
  }

  public updateGetAllTestSuitesNames(classStatement: ClassStatement) {
    let method = classStatement.methods.find((m) => m.name.text === 'getAllTestSuitesNames');
    if (method) {
      let text = `return [
        ${this.sessionInfo.testSuitesToRun.filter((s) => !s.isNodeTest)
          .map((s) => `"${s.name}"`).join('\n')
        }
      ]`;
      method.func.body.statements.push(new RawCodeStatement(text));
    }
  }

  public createNodeFiles(program: Program) {

    let p = path.join('components', 'rooibos', 'generated');

    for (let suite of this.sessionInfo.testSuitesToRun.filter((s) => s.isNodeTest)) {
      let xmlText = this.getNodeTestXmlText(suite);
      let bsPath = path.join(p, `${suite.generatedNodeName}.bs`);
      this.fileFactory.addFile(program, path.join(p, `${suite.generatedNodeName}.xml`), xmlText);
      this.fileFactory.addFile(program, bsPath, '');
      let bsFile = program.getFileByPkgPath(bsPath);
      if (bsFile) {
        (bsFile as BrsFile).parser.statements.push(this.getNodeTestBsBody(suite));
        bsFile.needsTranspiled = true;
      }
    }
  }

  private getNodeTestXmlText(suite: TestSuite) {
    return this.fileFactory.createTestXML(suite.generatedNodeName, suite.nodeName);
  }

  private getNodeTestBsBody(testSuite: TestSuite): RawCodeStatement {
    return new RawCodeStatement(`import "pkg:/${testSuite.file.pkgPath}"
    function init()
      nodeRunner = Rooibos_TestRunner(m.top.getScene(), m)
      m.top.rooibosTestResult = nodeRunner.runInNodeMode("${testSuite.name}")
    end function
    `, testSuite.file, testSuite.annotation.annotation.range);
  }

  public createIgnoredTestsInfoFunction(cs: ClassStatement) {
    let method = cs.methods.find((m) => m.name.text === 'getIgnoredTestInfo');
    if (method) {
      let text = `return {
          "count": ${this.sessionInfo.ignoredCount}
          "items":[
        ${this.sessionInfo.ignoredTestNames.map((name) => `"${name}",`).join('\n')}
  ]}
  `;

      method.func.body.statements.push(new RawCodeStatement(text));
    }
  }
}
