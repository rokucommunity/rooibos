import * as chai from 'chai';
import * as fs from 'fs-extra';

import { expect } from 'chai';

import ProjectProcessor from './RooibosProcessor';

const chaiSubset = require('chai-subset');
let dircompare = require('dir-compare');

chai.use(chaiSubset);
let processor: ProjectProcessor;
let sourcePath = 'src/test/stubProject';
let testsPath = 'build/source/tests';
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

describe('RooibosProcessor tests', function() {
  beforeEach(() => {
    clearFiles();
    copyFiles();
    processor = new ProjectProcessor(testsPath);
  });

  describe('Initialization', function() {
    it('correctly sets source paths and config', function() {
      expect(processor.testsPath).to.equal(testsPath);
    });
  });

  describe('Process files valid test', function() {
    it('tests file creation', () => {
      processor.processFiles();
    });
  });
});
