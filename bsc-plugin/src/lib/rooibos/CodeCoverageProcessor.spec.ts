// import * as chai from 'chai';
// import * as fs from 'fs-extra';

// import { Program, ProgramBuilder } from 'brighterscript';

// import { expect } from 'chai';

// import * as path from 'path';

// import { CodeCoverageProcessor } from './CodeCoverageProcessor';
// import { ProcessorConfig } from './ProcessorConfig';

// import File from './File';

// const chaiSubset = require('chai-subset');

// chai.use(chaiSubset);
// let processor: CodeCoverageProcessor;
// let sourcePath = 'src/test/stubProject';
// let targetPath = 'build';

// let bsConfig = require('/home/george/hope/open-source/rooibos/rooibos-roku-vsc-extension-plugin/src/test/stubProject/bsconfig.json'
// );
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

// describe('CodeCoverageProcessor tests', function() {
//   beforeEach(() => {
//     clearFiles();
//     copyFiles();
//     let _programBuilder = new ProgramBuilder();
//     bsConfig.rootDir = path.resolve('src/test/stubProject/src');

//     processor = new CodeCoverageProcessor(_programBuilder.program);
//   });

//   describe('Process files valid test', function() {
//     it('tests processor runs', async () => {
//       let f: File;
//       await processor.processFile(f);
//     });
//     it('tests creates CodeCoverageSupport file', async () => {
//       let f: File;
//       await processor.processFile(f);
//       let filePath = path.resolve(path.join(targetPath, 'source', 'CodeCoverageSupport.brs'));
//       expect(fs.existsSync(filePath)).to.be.true;
//     });
//     it('tests creates coverage component', async () => {
//       let f: File;
//       await processor.processFile(f);
//       let filePath = path.resolve(path.join(targetPath, 'components', 'CodeCoverage.xml'));
//       expect(fs.existsSync(filePath)).to.be.true;
//       filePath = path.resolve(path.join(targetPath, 'components', 'CodeCoverage.brs'));
//       expect(fs.existsSync(filePath)).to.be.true;
//     });
//   });

//   describe('specific file with lots of code use cases in it', function() {
//     it('tests processor runs', async () => {
//       let f: File;
//       await processor.processFile(f);
//       console.log('TODO - write tests - currently manually validating!!');
//     });
//   });
// });
