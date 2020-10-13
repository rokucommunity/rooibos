import * as path from 'path';
import * as fs from 'fs-extra';

import { BrsFile, ClassStatement, FunctionStatement, IfStatement, NamespaceStatement, ParseMode, ProgramBuilder, TokenKind } from 'brighterscript';

import { RooibosConfig } from './RooibosConfig';
import { SessionInfo } from './RooibosSessionInfo';
import { TestSuiteBuilder } from './TestSuiteBuilder';
import { changeClassMethodBody, createElseIf, createVarExpression } from './Utils';
import { RawCodeStatement } from './RawCodeStatement';
import { FileFactory } from './FileFactory';
import { TestSuite } from './TestSuite';
import { diagnosticErrorNoMainFound } from '../utils/Diagnostics';

const fs = require('fs-extra');
const pkg = require('../../../package.json');

export class RooibosSession {
  constructor(builder: ProgramBuilder) {
    this.fileFactory = new FileFactory();
    this._config = (builder.options as any).rooibos as RooibosConfig || {};
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
    this.sessionInfo = new SessionInfo(this._config);
  }

  public updateSessionStats() {
    this.sessionInfo.updateInfo();
  }

  public processFile(file: BrsFile): boolean {
    let testSuites = this._suiteBuilder.processFile(file);
    this.sessionInfo.updateTestSuites(testSuites);
    return testSuites.length > 0;
  }

  public addLaunchHook() {
    let mainFunc = null;
    let files = this._builder.program.getScopeByName("source").getFiles();
    for (let file of files) {
      mainFunc = file.parser.references.functionStatements.find((f) => f.name.text.toLowerCase() === 'main');
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
    let runtimeConfig = this._builder.program.getFileByPkgPath('source/rooibos/RuntimeConfig.bs') as BrsFile;
    if (runtimeConfig) {
      let classStatement = (runtimeConfig.ast.statements[0] as NamespaceStatement).body.statements[0] as ClassStatement;
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
      "failFast": ${this._config.failFast}
      "logLevel": ${this._config.logLevel}
      "showOnlyFailures": ${this._config.showFailuresOnly}
      "printLcov": ${this._config.printLcov === true}
      "rooibosPreprocessorVersion": "${pkg.version}"
      "port": ${this._config.port || 'Invalid'}
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
      let ifStatement = method.func.body.statements[0] as IfStatement;

      if (ifStatement) {
        for (let suite of this.sessionInfo.testSuitesToRun) {
          ifStatement.elseIfs.push(createElseIf(createVarExpression('name', TokenKind.Equal, suite.name), [new RawCodeStatement(`return ${suite.classStatement.getName(ParseMode.BrightScript)}`)]));
        }
      }
    }
  }

  public updateGetAllTestSuitesNames(classStatement: ClassStatement) {
    let method = classStatement.methods.find((m) => m.name.text === 'getAllTestSuitesNames');
    if (method) {
      let text = `return [
        ${this.sessionInfo.testSuitesToRun.filter((s) => !s.isNodeTest)
          .map((s) => `"${s.classStatement.getName(ParseMode.BrightScript)}"`).join('\n')
        }
      ]`;
      method.func.body.statements.push(new RawCodeStatement(text));
    }
  }

  public createNodeFiles(outPath: string) {

    let p = path.join(outPath, 'components', 'rooibos', 'generated');
    fs.mkdirSync(p, { recursive: true });

    for (let suite of this.sessionInfo.testSuitesToRun.filter((s) => s.isNodeTest)) {
      let xmlText = this.getNodeTestXmlText(suite);
      let brsText = this.getNodeTestBrsText(suite.name);
      fs.writeFileSync(path.join(p, `${suite.generatedNodeName}.xml`), xmlText);
      fs.writeFileSync(path.join(p, `${suite.generatedNodeName}.brs`), brsText);
    }
  }

  private getNodeTestXmlText(suite: TestSuite) {
    let imports = [suite.file.pkgPath];
    return this.fileFactory.createTestXML(suite.generatedNodeName, suite.nodeName, imports);
  }

  private getNodeTestBrsText(testName: string) {
    return `function init()
      nodeRunner = Rooibos_TestRunner(m.top.getScene(), m)
      m.top.rooibosTestResult = nodeRunner.runInNodeMode("${testName}")
    end function
    
    `
  }

  public createIgnoredTestsInfoFunction(cs: ClassStatement) {
    let method = cs.methods.find((m) => m.name.text === 'getIgnoredTestInfo');
    if (method) {
      let text = `return [
        {
          "count": ${this.sessionInfo.ignoredCount}
          "items":[
        ${this.sessionInfo.ignoredTestNames.map((name) => `"${name}",`).join('\n')}
  ]
  `;

      method.func.body.statements.push(new RawCodeStatement(text));
    }
  }
}
