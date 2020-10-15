import * as chai from 'chai';

// eslint-disable-next-line
import { expect } from 'chai';

import { TestSuiteBuilder } from './TestSuiteBuilder';
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

describe.only('TestSuiteBuilder tests ', () => {

  beforeEach(() => {
    program = new Program({});
    fileFactory = new FileFactory({});
    programBuilder = new ProgramBuilder();
    session = new RooibosSession(programBuilder, fileFactory);
    testSuiteBuilder = new TestSuiteBuilder(session);

  });

  describe('No suites', () => {
    it('no suite', () => {
      let testSuite = createTestSuite('test1.bs', `
      `);
      expect(testSuite).to.be.null;
    });

    it('no suite - namespace', () => {
      let testSuite = createTestSuite('test1.bs', `namespace empty
      end namespace
      `);
      expect(testSuite).to.be.null;
    });

    it('no suite - namespace with funcs', () => {
      let testSuite = createTestSuite('test1.bs', `namespace empty
      function foo()
      end function
      end namespace
      `);
      expect(testSuite).to.be.null;
    });

    it('no suite - namespace with class', () => {
      let testSuite = createTestSuite('test1.bs', `namespace empty
      class fooClass
      end class
      end namespace
      `);
      expect(testSuite).to.be.null;
    });

    it('no suite - class', () => {
      let testSuite = createTestSuite('test1.bs', `class fooClass
      end class
      `);
      expect(testSuite).to.be.null;
    });
  });


  describe('Has suites', () => {
    it('class with one, group and 2 tests ', () => {
      let testSuite = createTestSuite('test1.bs', `namespace Tests

  '@TestSuite Rooibos assertion tests
  class AssertionTests extends Rooibos.BaseTestSuite

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    '@It tests basic assertions
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    '@Test Fail
    function test_fail() as void

      assertResult = m.Fail("reason")

      isFail = m.currentResult.isFail
      m.currentResult.Reset()

      m.assertFalse(assertResult)
      m.assertTrue(isFail)
    end function

    '@Test AssertTrue
    '@Params[true, true]
    '@Params[false, false]
    '@Params[invalid, false]
    '@Params[0, false]
    '@Params[1, false]
    '@Params["test", false]
    function test_assertTrue(value, expectedAssertResult) as void
    end function
  end class
end namespace
      `);
      expect(testSuite).to.not.be.null;
      expect(testSuite.testGroups).to.have.lengthOf(1);
    });
  });
});

function createTestSuite(path: string, text: string): TestSuite {
  let file = new BrsFile(path, path, program);
  file.parse(text);
  let testSuites = testSuiteBuilder.processFile(file);
  return testSuites.length > 0 ? testSuites[0] : null;
}
