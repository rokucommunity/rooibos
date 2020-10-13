import {
  BrsFile,
  CallableContainerMap,
  CompilerPlugin,
  FileObj,
  Program,
  ProgramBuilder,
  Scope,
  SourceObj,
  TranspileObj,
  Util,
  XmlFile,
} from 'brighterscript';

import { isBrsFile } from 'brighterscript/dist/astUtils';

import { RooibosSession } from './lib/rooibos/RooibosSession';

import { CodeCoverageProcessor } from './lib/rooibos/CodeCoverageProcessor';
import { FileFactory } from './lib/rooibos/FileFactory';

const path = require('path');

const pluginInterface: CompilerPlugin = {
  name: 'rooibosPlugin',
  beforeProgramCreate: beforeProgramCreate,
  afterProgramCreate: afterProgramCreate,
  afterScopeCreate: afterScopeCreate,
  beforeFileParse: beforeFileParse,
  afterFileParse: afterFileParse,
  afterProgramValidate: afterProgramValidate,
  beforePublish: beforePublish,
  beforeFileTranspile: beforeFileTranspile,
  afterFileTranspile: afterFileTranspile,
  beforeScopeValidate: beforeScopeValidate,
  afterPublish: afterPublish
};

export default pluginInterface;

let session: RooibosSession;
let codeCoverageProcessor: CodeCoverageProcessor;
let fileFactory = new FileFactory();
let isFrameworkAdded = false;

function beforeProgramCreate(builder: ProgramBuilder): void {
  if (!session) {
    session = new RooibosSession(builder);
    codeCoverageProcessor = new CodeCoverageProcessor(builder);
  }
}

function afterProgramCreate(program: Program) {
  if (!isFrameworkAdded) {
    fileFactory.addFrameworkFiles(program);
  }
}

function afterScopeCreate(scope: Scope) {
}

function beforeFileParse(source: SourceObj): void {
}

function afterFileParse(file: (BrsFile | XmlFile)): void {
  if (fileFactory.isIgnoredFile(file)) {
    return;
  }
  if (isBrsFile(file)) {
    if (session.processFile(file)) {
      //
    } else {
      codeCoverageProcessor.addCodeCoverage(file);
    }
  }
}

function beforePublish(builder: ProgramBuilder, files: FileObj[]) {
  session.updateSessionStats();
  for (let testSuite of [...session.sessionInfo.testSuitesToRun.values()]) {
    testSuite.addDataFunctions();
    for (let group of [...testSuite.testGroups.values()]) {
      for (let testCase of [...group.testCases.values()]) {
        group.modifyAssertions(testCase);
      }
    }

  }
  session.addTestRunnerMetadata();
  session.addLaunchHook();
}

function afterProgramValidate(program: Program) {

  for (let testSuite of [...session.sessionInfo.testSuites.values()]) {
    testSuite.validate();
  }
}

function beforeFileTranspile(entry: TranspileObj) {
}

function afterFileTranspile(entry: TranspileObj) {
}

// tslint:disable-next-line:array-type
function beforeScopeValidate(scope: Scope, files: (BrsFile | XmlFile)[], callables: CallableContainerMap) {
}

function afterPublish(builder: ProgramBuilder, files: FileObj[]) {
  //create node test files
  session.createNodeFiles(path.resolve(builder.options.stagingFolderPath));
}

