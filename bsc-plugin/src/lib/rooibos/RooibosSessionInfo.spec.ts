import * as chai from 'chai';


import { TestSuiteBuilder } from './TestSuiteBuilder';
import { SessionInfo } from './RooibosSessionInfo';
import { TestSuite } from './TestSuite';
import { BrsFile, Program, ProgramBuilder } from 'brighterscript';
import { RooibosSession } from './RooibosSession';
import { FileFactory } from './FileFactory';

// eslint-disable-next-line
const chaiSubset = require('chai-subset');

chai.use(chaiSubset);

let program: Program;
let fileFactory: FileFactory;
let programBuilder: ProgramBuilder;
let session: RooibosSession;
let testSuiteBuilder: TestSuiteBuilder;

describe('RooibosSessionInfo tests ', () => {
  // eslint-disable-next-line

  beforeEach(() => {
    SessionInfo;
    program = new Program({});
    fileFactory = new FileFactory({});
    programBuilder = new ProgramBuilder();
    session = new RooibosSession(programBuilder, fileFactory);
    testSuiteBuilder = new TestSuiteBuilder(session);

  });

  describe('Initialization', () => {
    it('correctly sets source paths and config', () => {
    });
  });
});


function createTestSuite(path: string, text: string): TestSuite {
  let file = new BrsFile(path, path, program);
  file.parse(text);
  let testSuites = testSuiteBuilder.processFile(file);
  return testSuites.length > 0 ? testSuites[0] : null;
}
