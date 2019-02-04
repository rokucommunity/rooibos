import * as chai from 'chai';
import * as fs from 'fs-extra';

import { expect } from 'chai';

import FileDescriptor from './FileDescriptor';
import { TestCase } from './TestCase';
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

describe('TestCase tests ', function() {
  beforeEach(() => {
    builder = new TestSuiteBuilder(50);
  });

  describe('asJson', function() {
    beforeEach(() => {
      clearFiles();
      copyFiles();
    });

    it('processes valid test file', () => {
      let fileDescriptor = new FileDescriptor(`build/source/tests`, `VideoModuleTests.brs`, `.brs`);
      let testSuite = builder.processFile(fileDescriptor);
      expect(testSuite).to.not.be.null;
      expect(testSuite.isValid).to.be.true;
      let json: any = testSuite.asJson();
      expect(json).to.not.be.null;
      expect(json.itGroups['1'].testCases['1'].isParamsValid).to.be.true;
      expect(json.itGroups['1'].testCases['1'].isParamTest).to.be.true;
      expect(json.itGroups['1'].testCases['1'].expectedNumberOfParams).to.equal(3);
      expect(json.itGroups['1'].testCases['1'].rawParams.length).to.equal(3);
    });

    it('rawParams value for non params test', () => {
      let testCase = new TestCase('test', 'testFunc', true, false, 10);
      let json: any = testCase.asJson();
      expect(json).to.not.be.null;
      expect(json.isParamTest).to.be.false;
      expect(json.isParamsValid).to.be.false;
      expect(json.expectedNumberOfParams).to.equal(0);
      expect(json.rawParams.length).to.equal(0);
    });
  });
});
