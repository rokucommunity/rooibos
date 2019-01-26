import * as chai from 'chai';
import * as fs from 'fs-extra';

import { expect } from 'chai';

import FileDescriptor from './FileDescriptor';
import { Tag } from './Tag';
import { TestSuiteBuilder } from './TestSuiteBuilder';

const chaiSubset = require('chai-subset');

chai.use(chaiSubset);
let builder: TestSuiteBuilder;
let sourcePath = 'src/test/stubProject';
let targetPath = 'build';

function clearFiles() {
  fs.removeSync(targetPath);
}

function copyFiles() {
  try {
    fs.copySync(sourcePath, targetPath);
  } catch (err) {
    console.error(err);
  }
}

describe('TestSuiteBuilder tests ', function() {
  beforeEach(() => {
    builder = new TestSuiteBuilder(50);
  });

  describe('Initialization', function() {
    it('correctly sets source paths and config', function() {
      expect(builder.maxLinesWithoutSuiteDirective).to.equal(50);
    });
  });

  describe('getFunctionFromLine', function() {
    it('checks non function lines', () => {
      expect(builder.getFunctionFromLine('')).to.be.null;
      expect(builder.getFunctionFromLine('    ')).to.be.null;
      expect(builder.getFunctionFromLine(' m.this  = "someValue')).to.be.null;
      expect(builder.getFunctionFromLine(`'   function long_word_Different1(with Args) as void`)).to.be.null;
      expect(builder.getFunctionFromLine(`'function foo() as void`)).to.be.null;
    });

    it('checks function lines', () => {
      expect(builder.getFunctionFromLine('function foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('sub foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('   sub foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('   function foo() as void')).to.equal('foo');
      expect(builder.getFunctionFromLine('   function long_word_Different1() as void')).to.equal('long_word_Different1');
      expect(builder.getFunctionFromLine('   function long_word_Different1(with Args) as void')).to.equal('long_word_Different1');
    });
  });

  describe('getTagText', function() {
    it('no text/not a tag', () => {
      expect(builder.getTagText(`@TestSuite`, Tag.TEST_SUITE)).to.be.empty;
      expect(builder.getTagText(`NOT`, Tag.TEST_SUITE)).to.be.empty;
    });

    it('has text and has tag', () => {
      expect(builder.getTagText(`@TestSuite someText`, Tag.TEST_SUITE)).to.equal(`someText`);
      expect(builder.getTagText(`@TestSuite someText here`, Tag.TEST_SUITE)).to.equal(`someText here`);
      expect(builder.getTagText(`@TestSuite     someText here2`, Tag.TEST_SUITE)).to.equal(`someText here2`);
    });
  });

  describe('processFile', function() {
    beforeEach(() => {
      clearFiles();
      copyFiles();
    });

    it('ignores null file descriptor', () => {
      let testSuite = builder.processFile(null);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.false;
    });

    it('ignores empty file contents', () => {
      let fileDescriptor = new FileDescriptor(`source`, `test.brs`, `.brs`);
      fileDescriptor.setFileContents('');
      let testSuite = builder.processFile(fileDescriptor);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.false;
    });

    it('processes valid test file', () => {
      let fileDescriptor = new FileDescriptor(`build/source/tests`, `VideoModuleTests.brs`, `.brs`);
      let testSuite = builder.processFile(fileDescriptor);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
    });

    it('processes solo test suite', () => {
      let fileDescriptor = new FileDescriptor(`build/source/tests`, `soloSuite.brs`, `.brs`);
      let testSuite = builder.processFile(fileDescriptor);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.isSolo).to.be.true;
    });

    it('processes solo group', () => {
      let fileDescriptor = new FileDescriptor(`build/source/tests`, `soloGroup.brs`, `.brs`);
      let testSuite = builder.processFile(fileDescriptor);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.hasSoloGroups).to.be.true;
    });

    it('processes solo test', () => {
      let fileDescriptor = new FileDescriptor(`build/source/tests`, `soloTest.brs`, `.brs`);
      let testSuite = builder.processFile(fileDescriptor);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      expect(testSuite.hasSoloTests).to.be.true;
    });

    it('simple params', () => {
      let fileDescriptor = new FileDescriptor(`build/source/tests`, `paramsTest.brs`, `.brs`);
      let testSuite = builder.processFile(fileDescriptor);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
    });

  });
});
