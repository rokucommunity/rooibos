// import * as chai from 'chai';
// import * as fs from 'fs-extra';

// import { expect } from 'chai';

// import { TestSuiteBuilder } from './TestSuiteBuilder';
// import { makeFile } from './TestUtils';

// const chaiSubset = require('chai-subset');

// chai.use(chaiSubset);
// let builder: TestSuiteBuilder;
// let sourcePath = 'src/test/stubProject';
// let targetPath = 'build';

// function clearFiles() {
//   fs.removeSync(targetPath);
// }

// function copyFiles() {
//   try {
//     fs.copySync(sourcePath, targetPath);
//   } catch (err) {
//     console.error(err);
//   }
// }

// describe('TestSuite tests ', function() {
//   beforeEach(() => {
//     builder = new TestSuiteBuilder(50, false);
//   });

//   describe('asJson', function() {
//     beforeEach(() => {
//       clearFiles();
//       copyFiles();
//     });

//     it('processes valid test file', () => {
//       let file = makeFile(`build/source/tests/specs`, `VideoModuleTests.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//       let json = testSuite.asJson();
//       expect(json).to.not.be.null;
//     });
//   });
// });
