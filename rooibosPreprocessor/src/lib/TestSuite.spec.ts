import * as chai from 'chai';
import * as fs from 'fs-extra';

import { expect } from 'chai';

import FileDescriptor from './FileDescriptor';
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

describe('TestSuite tests ', function() {
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
      let json = testSuite.asJson();
      expect(json).to.not.be.null;
    });
  });
});
