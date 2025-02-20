import * as chai from 'chai';

// eslint-disable-next-line
import { expect } from 'chai';

import { TestSuiteBuilder } from './TestSuiteBuilder';
import type { TestSuite } from './TestSuite';
import type { TestCase } from './TestCase';
import { BrsFile, Program, ProgramBuilder } from 'brighterscript';
import { RooibosSession } from './RooibosSession';
import { FileFactory } from './FileFactory';
import type { TestGroup } from './TestGroup';

// eslint-disable-next-line
const chaiSubset = require('chai-subset');

chai.use(chaiSubset);

let program: Program;
let fileFactory: FileFactory;
let programBuilder: ProgramBuilder;
let session: RooibosSession;
let testSuiteBuilder: TestSuiteBuilder;

describe('TestSuiteBuilder tests ', () => {

    beforeEach(() => {
        program = new Program({});
        fileFactory = new FileFactory();
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

    describe('Suite issues', () => {

        it('duplicate suite name - different files', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            let testSuite2 = createTestSuite('test2.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function
      end class
      end namespace
      `);
            assertSuiteError(testSuite2);
            expect(ts.isValid).to.be.false;
        });

        it('duplicate suite name - same file', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function
      end class
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function
      end class
      end namespace
      `);
            assertSuiteError(ts);
        });

        it('duplicate group', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @describe("group1")

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuiteError(ts);
        });

        it('duplicate test', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @it("one")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuiteError(ts);
        });

    });

    describe('Has valid suites', () => {
        it('class with 1 group, 1 test', () => {
            let testSuite = createTestSuite('test1.bs', `namespace Tests

  @suite("Rooibos assertion tests")
  class AssertionTests extends rooibos.BaseTestSuite

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("group1")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @it("one")
    function test_one()
    end function
  end class
end namespace
      `);
            assertSuite(testSuite, 1);
            assertGroupCount(testSuite, 0, 1);
        });
    });

    it('class with 1 group 2 tests', () => {
        let testSuite = createTestSuite('test1.bs', `namespace Tests

  @suite("Rooibos assertion tests")
  class AssertionTests extends rooibos.BaseTestSuite

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("group1")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @it("one")
    function test_one()
    end function

    @it("two")
    function test_two()
    end function
end class
end namespace
      `);
        assertSuite(testSuite, 1);
        assertGroupCount(testSuite, 0, 2);
    });

    it('class with 2 group, 1 test each', () => {
        let testSuite = createTestSuite('test1.bs', `namespace Tests

    @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("group1")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @it("one")
    function test_one()
    end function

    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    @describe("group2")
    '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    @it("two")
    function test_two()
    end function
    end class
    end namespace
    `);
        assertSuite(testSuite, 2);
        assertGroupCount(testSuite, 0, 1);
        assertGroupCount(testSuite, 1, 1);

    });

    it('class with 2 group, 1 test each - concise syntax', () => {
        let testSuite = createTestSuite('test1.bs', `namespace Tests

    @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite

    @describe("group1")

    @it("one")
    function test_one()
    end function

    @describe("group2")

    @it("two")
    function test_two()
    end function
    end class
    end namespace
    `);
        assertSuite(testSuite, 2);
        assertGroupCount(testSuite, 0, 1);
        assertGroupCount(testSuite, 1, 1);

    });

    it('Valid params', () => {
        let testSuite = createTestSuite('test1.bs', `namespace Tests

    @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite

    @describe("group1")

    @it("one")
    @params(true, "one")
    function test_one(v1, v2)
    end function
    end class
    end namespace
    `);
        assertSuite(testSuite, 1);
        assertGroupCount(testSuite, 0, 1);
        assertParamTestCase(testSuite, 0, 0, 0);
    });

    it('Valid params 2 params', () => {
        let testSuite = createTestSuite('test1.bs', `namespace Tests

    @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite

    @describe("group1")

    @it("one")
    @params(true, "one")
    @params(true, "one")
    function test_one(v1, v2)
    end function
    end class
    end namespace
    `);
        assertSuite(testSuite, 1);
        assertGroupCount(testSuite, 0, 2);
        assertParamTestCase(testSuite, 0, 0, 0);
        assertParamTestCase(testSuite, 0, 1, 1);
    });

    it('Valid params 5 params', () => {
        let testSuite = createTestSuite('test1.bs', `namespace Tests

    @suite("Rooibos assertion tests")
    class AssertionTests extends rooibos.BaseTestSuite

    @describe("group1")

    @it("one")
    @params(true, "1")
    @params(true, "2")
    @params(true, "3")
    @params(true, "4")
    @params(true, "5")
    function test_one(v1, v2)
    end function
    end class
    end namespace
    `);
        assertSuite(testSuite, 1);
        assertGroupCount(testSuite, 0, 5);
        assertParamTestCase(testSuite, 0, 0, 0);
        assertParamTestCase(testSuite, 0, 1, 1);
        assertParamTestCase(testSuite, 0, 2, 2);
        assertParamTestCase(testSuite, 0, 3, 3);
        assertParamTestCase(testSuite, 0, 4, 4);
    });
    describe('only tags', () => {
        it('only suite', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @only
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.true;
            expect(getGroup(ts, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.false;
            expect(ts.hasSoloTests).to.be.false;
            expect(ts.hasSoloGroups).to.be.false;

        });
        it('only group', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @only
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.false;
            expect(getGroup(ts, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.false;
            expect(ts.hasSoloTests).to.be.false;
            expect(ts.hasSoloGroups).to.be.true;

        });
        it('only test', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @only
      @it("one")
      function test_one()
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.false;
            expect(getGroup(ts, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.false;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.false;

        });
        it('two tests', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @only
      @it("one")
      function test_one()
      end function

      @only
      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.false;
            expect(getGroup(ts, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.true;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.false;
        });
        it('two tests and group', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @only
      @describe("group1")

      @only
      @it("one")
      function test_one()
      end function

      @only
      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.false;
            expect(getGroup(ts, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.true;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.true;
        });
        it('all', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @only
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @only
      @describe("group1")

      @only
      @it("one")
      function test_one()
      end function

      @only
      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.true;
            expect(getGroup(ts, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.true;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.true;
        });
        it('two groups', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @only
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @only
      @describe("group1")

      @only
      @it("one")
      function test_one()
      end function

      @only
      @it("two")
      function test_Two()
      end function
      @describe("group2")

      @it("one")
      function test_g2_one()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 2);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.true;
            expect(getGroup(ts, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.true;
            assertGroupCount(ts, 1, 1);
            expect(getGroup(ts, 1).isSolo).to.be.false;
            expect(getTestCase(ts, 1, 0).isSolo).to.be.false;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.true;
        });
        it('mixup', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @only
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @only
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @only
      @it("two")
      function test_Two()
      end function
      @describe("group2")

      @only
      @it("one")
      function test_g2_one()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 2);
            assertGroupCount(ts, 0, 2);
            expect(ts.isSolo).to.be.true;
            expect(getGroup(ts, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.true;
            assertGroupCount(ts, 1, 1);
            expect(getGroup(ts, 1).isSolo).to.be.false;
            expect(getTestCase(ts, 1, 0).isSolo).to.be.true;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.true;
        });
        it('only on param block', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @Only
      @it("one")
      @params("1")
      @params("2")
      @params("3")
      function test_one(value)
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 4);
            expect(ts.isSolo).to.be.false;
            expect(getGroup(ts, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 2).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 3).isSolo).to.be.false;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.false;

        });

        it('onlyparams', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("1")
      @onlyParams("2")
      @params("3")
      function test_one(value)
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 4);
            expect(ts.isSolo).to.be.false;
            expect(getGroup(ts, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 2).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 3).isSolo).to.be.false;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.false;

        });

        it('onlyparams 2', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @onlyParams("1")
      @params("2")
      @onlyParams("3")
      function test_one(value)
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 4);
            expect(ts.isSolo).to.be.false;
            expect(getGroup(ts, 0).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 0).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 1).isSolo).to.be.false;
            expect(getTestCase(ts, 0, 2).isSolo).to.be.true;
            expect(getTestCase(ts, 0, 3).isSolo).to.be.false;
            expect(ts.hasSoloTests).to.be.true;
            expect(ts.hasSoloGroups).to.be.false;

        });

    });

    describe('ignore tags', () => {
        it('ignore suite', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @ignore
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.true;
            expect(getGroup(ts, 0).isIgnored).to.be.false;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.false;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.false;
            expect(ts.hasIgnoredTests).to.be.false;

        });
        it('ignore group', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @ignore
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.false;
            expect(getGroup(ts, 0).isIgnored).to.be.true;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.false;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.false;
            expect(ts.hasIgnoredTests).to.be.false;
        });
        it('ignore test', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @ignore
      @it("one")
      function test_one()
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.false;
            expect(getGroup(ts, 0).isIgnored).to.be.false;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.false;
            expect(ts.hasIgnoredTests).to.be.true;

        });
        it('two tests', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @ignore
      @it("one")
      function test_one()
      end function

      @ignore
      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.false;
            expect(getGroup(ts, 0).isIgnored).to.be.false;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.true;
            expect(ts.hasIgnoredTests).to.be.true;
        });
        it('two tests and group', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @ignore
      @describe("group1")

      @ignore
      @it("one")
      function test_one()
      end function

      @ignore
      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.false;
            expect(getGroup(ts, 0).isIgnored).to.be.true;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.true;
            expect(ts.hasIgnoredTests).to.be.true;
        });
        it('all', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @ignore
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @ignore
      @describe("group1")

      @ignore
      @it("one")
      function test_one()
      end function

      @ignore
      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.true;
            expect(getGroup(ts, 0).isIgnored).to.be.true;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.true;
            expect(ts.hasIgnoredTests).to.be.true;
            expect(ts.hasIgnoredTests).to.be.true;
        });
        it('two groups', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @ignore
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @ignore
      @describe("group1")

      @ignore
      @it("one")
      function test_one()
      end function

      @ignore
      @it("two")
      function test_Two()
      end function
      @describe("group2")

      @it("one")
      function test_g2_one()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 2);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.true;
            expect(getGroup(ts, 0).isIgnored).to.be.true;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.true;
            assertGroupCount(ts, 1, 1);
            expect(getGroup(ts, 1).isIgnored).to.be.false;
            expect(getGroup(ts, 1).hasIgnoredTests).to.be.false;
            expect(getTestCase(ts, 1, 0).isIgnored).to.be.false;
            expect(ts.hasIgnoredTests).to.be.true;
            expect(ts.hasIgnoredTests).to.be.true;
        });
        it('mixup', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @ignore
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @ignore
      @describe("group1")

      @it("one")
      function test_one()
      end function

      @ignore
      @it("two")
      function test_Two()
      end function
      @describe("group2")

      @ignore
      @it("one")
      function test_g2_one()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 2);
            assertGroupCount(ts, 0, 2);
            expect(ts.isIgnored).to.be.true;
            expect(getGroup(ts, 0).isIgnored).to.be.true;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.false;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.true;
            assertGroupCount(ts, 1, 1);
            expect(getGroup(ts, 1).hasIgnoredTests).to.be.true;
            expect(getGroup(ts, 1).isIgnored).to.be.false;
            expect(getTestCase(ts, 1, 0).isIgnored).to.be.true;
            expect(ts.hasIgnoredTests).to.be.true;
            expect(ts.hasIgnoredTests).to.be.true;
        });
        it('ignore on param block', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @ignore
      @it("one")
      @params("1")
      @params("2")
      @params("3")
      function test_one(value)
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 4);
            expect(ts.isIgnored).to.be.false;
            expect(getGroup(ts, 0).isIgnored).to.be.false;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 2).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 3).isIgnored).to.be.false;
            expect(ts.hasIgnoredTests).to.be.true;

        });

        it('ignoreParams', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("1")
      @ignoreParams("2")
      @params("3")
      function test_one(value)
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 4);
            expect(ts.isIgnored).to.be.false;
            expect(getGroup(ts, 0).isIgnored).to.be.false;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.false;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 2).isIgnored).to.be.false;
            expect(getTestCase(ts, 0, 3).isIgnored).to.be.false;
            expect(ts.hasIgnoredTests).to.be.true;

        });

        it('ignoreParams 2', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @ignoreParams("1")
      @params("2")
      @ignoreParams("3")
      function test_one(value)
      end function

      @it("two")
      function test_Two()
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 4);
            expect(ts.isIgnored).to.be.false;
            expect(getGroup(ts, 0).isIgnored).to.be.false;
            expect(getGroup(ts, 0).hasIgnoredTests).to.be.true;
            expect(getTestCase(ts, 0, 0).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 1).isIgnored).to.be.false;
            expect(getTestCase(ts, 0, 2).isIgnored).to.be.true;
            expect(getTestCase(ts, 0, 3).isIgnored).to.be.false;
            expect(ts.hasIgnoredTests).to.be.true;

        });
    });

    describe('params', () => {

        it('simple params', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("1")
      @params("2")
      @params("3")
      function test_one(value)
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 3);
        });

        it('2 params', () => {
            let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("1", true)
      @params("2", false)
      @params("3", true)
      function test_one(value, arg2)
      end function
      end class
      end namespace
      `);
            assertSuite(ts, 1);
            assertGroupCount(ts, 0, 3);
        });
    });

    it('2 with url and chars', () => {
        let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("http://google.com/thing", true)
      @params("#'_!!@#%", false)
      @params("3", true)
      function test_one(value, arg2)
      end function
      end class
      end namespace
      `);
        assertSuite(ts, 1);
        assertGroupCount(ts, 0, 3);
    });

    it('param mismatch -no params', () => {
        let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      function test_one(value, arg2)
      end function
      end class
      end namespace
      `);
        assertSuiteError(ts);
    });
    it('param mismatch -one', () => {
        let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("http://google.com/thing")
      @params("#'_!!@#%", false)
      @params("3", true)
      function test_one(value, arg2)
      end function
      end class
      end namespace
      `);
        assertSuiteError(ts);
    });

    it('param mismatch -all', () => {
        let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("http://google.com/thing", true)
      @params("#'_!!@#%", false)
      @params("3", true)
      function test_one(value)
      end function
      end class
      end namespace
      `);
        assertSuiteError(ts);
    });

    it('cannot parse', () => {
        let ts = createTestSuite('test1.bs', `namespace Tests
      @suite("Rooibos assertion tests")
      class AssertionTests extends rooibos.BaseTestSuite
      @describe("group1")

      @it("one")
      @params("http://google.com/thing", true ")
      @params("#'_!!@#%", false)
      @params("3", true)
      function test_one(value, value)
      end function
      end class
      end namespace
      `);
        assertSuiteError(ts);
    });
});

function assertSuite(testSuite: TestSuite, expectedGroups: number) {
    expect(testSuite).to.not.be.null;
    expect(testSuite.isValid).to.be.true;
    expect(testSuite.getTestGroups()).to.have.lengthOf(expectedGroups);
}

function assertSuiteError(testSuite: TestSuite) {
    expect(testSuite).to.not.be.null;
    expect(testSuite.isValid).to.be.false;
}

function assertGroupCount(testSuite: TestSuite, groupIndex: number, expectedTests: number) {
    expect(testSuite.getTestGroups()[groupIndex].testCases).to.have.lengthOf(expectedTests);
}

function getTestCase(testSuite: TestSuite, groupIndex: number, testIndex: number): TestCase {
    let group = testSuite.getTestGroups()[groupIndex];
    return group.testCases[testIndex];
}

function getGroup(testSuite: TestSuite, groupIndex: number): TestGroup {
    return testSuite.getTestGroups()[groupIndex];
}

function assertParamTestCase(testSuite: TestSuite, groupIndex: number, testIndex: number, paramIndex = 0) {
    let testCase = getTestCase(testSuite, groupIndex, testIndex);
    expect(testCase.isParamTest).to.be.true;
    expect(testCase.paramTestIndex).to.equal(paramIndex);
}

function createTestSuite(path: string, text: string): TestSuite {
    let file = new BrsFile(path, path, program);
    file.parse(text);
    let testSuites = testSuiteBuilder.processFile(file);
    return testSuites.length > 0 ? testSuites[0] : null;
}
