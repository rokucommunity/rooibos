import * as chai from 'chai';
import * as fs from 'fs-extra';
import * as path from 'path';

import { expect } from 'chai';

import FunctionMap from './FunctionMap';
import { RuntimeConfig } from './RuntimeConfig';

const chaiSubset = require('chai-subset');

chai.use(chaiSubset);
let runtimeConfig: RuntimeConfig;
let sourcePathBunchOfFiles = 'src/test/stubProject';
let sourcePathOneFile = 'src/test/stubProjectOnlyTests_oneFile';
let sourcePathSoloTests = 'src/test/stubProjectOnlyTests';
let sourcePathSoloGroup = 'src/test/stubProjectOnlyItGroup';
let sourcePathSoloSuites = 'src/test/stubProjectOnlySuite';
let sourcePathNoSolos = 'src/test/stubProjectNoSolos';
let targetPath = 'build';

function clearFiles() {
  fs.removeSync(targetPath);
}

function copyFiles(sourcePath) {
  try {
    fs.copySync(sourcePath, targetPath);
  } catch (err) {
    console.error(err);
  }
}

describe('RuntimeConfig tests ', function() {
  beforeEach(() => {
    let functionMap = new FunctionMap();
    runtimeConfig = new RuntimeConfig(functionMap);
  });

  describe('oneFile', function() {
    beforeEach(() => {
      clearFiles();
    });

    it('processes valid test file', () => {
      copyFiles(sourcePathOneFile);
      runtimeConfig.processPath(path.join(targetPath, 'source/tests'), targetPath);
      let suites = runtimeConfig.testSuites;
      expect(suites).to.not.be.null;
    });

    it('processes bunch of files', () => {
      copyFiles(sourcePathBunchOfFiles);
      runtimeConfig.processPath(path.join(targetPath, 'source/tests'), targetPath);
      let suites = runtimeConfig.testSuites;
      expect(suites).to.not.be.null;
    });

    it('processes files with solo suite', () => {
      copyFiles(sourcePathSoloSuites);
      runtimeConfig.processPath(path.join(targetPath, 'source/tests'), targetPath);
      let suites = runtimeConfig.testSuites;
      expect(suites).to.not.be.null;
    });

    it('processes files with solo group', () => {
      copyFiles(sourcePathSoloGroup);
      runtimeConfig.processPath(path.join(targetPath, 'source/tests'), targetPath);
      let suites = runtimeConfig.testSuites;
      expect(suites).to.not.be.null;
    });

    it('processes files with solo tests', () => {
      copyFiles(sourcePathSoloTests);
      runtimeConfig.processPath(path.join(targetPath, 'source/tests'), targetPath);
      let suites = runtimeConfig.testSuites;
      expect(suites).to.not.be.null;
    });

    it('processes files with no solo tests', () => {
      copyFiles(sourcePathNoSolos);
      runtimeConfig.processPath(path.join(targetPath, 'source/tests'), targetPath);
      let suites = runtimeConfig.testSuites;
      expect(suites).to.not.be.null;
      let json = runtimeConfig.asJson(); //TODO test these return values
    });
  });
});
