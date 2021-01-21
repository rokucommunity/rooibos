import {
  BrsFile,
  BscFile,
  CallableContainerMap,
  CompilerPlugin,
  FileObj,
  Program,
  ProgramBuilder,
  Scope,
  SourceObj,
  TranspileObj,
  Util,
  XmlFile
} from 'brighterscript';

import { isBrsFile } from 'brighterscript/dist/astUtils';

import { RooibosSession } from './lib/rooibos/RooibosSession';

import { CodeCoverageProcessor } from './lib/rooibos/CodeCoverageProcessor';
import { FileFactory } from './lib/rooibos/FileFactory';

import * as path from 'path';

class RooibosPlugin {

  name: 'rooibosPlugin';
  public session: RooibosSession;
  public codeCoverageProcessor: CodeCoverageProcessor;
  public fileFactory: FileFactory;
  public isFrameworkAdded = false;
  public _builder: ProgramBuilder;

  beforeProgramCreate(builder: ProgramBuilder): void {
    this._builder = builder;
    this.fileFactory = new FileFactory((builder.options as any).rooibos || {});

    if (!this.session) {
      this.session = new RooibosSession(builder, this.fileFactory);
      this.codeCoverageProcessor = new CodeCoverageProcessor(builder);
    }
  }

  afterProgramCreate(program: Program) {
    if (!this.isFrameworkAdded) {
      this.fileFactory.addFrameworkFiles(program);
    }
  }

  afterScopeCreate(scope: Scope) {
  }

  beforeFileParse(source: SourceObj): void {
  }

  afterFileParse(file: (BrsFile | XmlFile)): void {
    if (this.fileFactory.isIgnoredFile(file)) {
      return;
    }
    if (isBrsFile(file)) {
      if (this.session.processFile(file)) {
        //
      } else {
        this.codeCoverageProcessor.addCodeCoverage(file);
      }
    }
  }

  beforePublish(builder: ProgramBuilder, files: FileObj[]) {
    for (let testSuite of [...this.session.sessionInfo.testSuitesToRun.values()]) {
      testSuite.addDataFunctions();
      for (let group of [...testSuite.testGroups.values()]) {
        for (let testCase of [...group.testCases.values()]) {
          group.modifyAssertions(testCase);
        }
      }

    }
    this.session.addTestRunnerMetadata();
    this.session.addLaunchHook();
    this.session.createNodeFiles(this._builder.program);
  }

  beforeProgramValidate(program: Program) {
    this.session.updateSessionStats();
    for (let testSuite of [...this.session.sessionInfo.testSuites.values()]) {
      testSuite.validate();
    }
  }

  afterProgramValidate(program: Program) {
  }

  beforeFileTranspile(entry: TranspileObj) {
  }

  afterFileTranspile(entry: TranspileObj) {
  }

  // tslint:disable-next-line:array-type
  beforeScopeValidate(scope: Scope, files: (BrsFile | XmlFile)[], callables: CallableContainerMap) {
  }

  afterPublish(builder: ProgramBuilder, files: FileObj[]) {
    //create node test files
  }

  afterFileValidate(file: BscFile) {
  }

}

export default function () {
  return new RooibosPlugin();
}
