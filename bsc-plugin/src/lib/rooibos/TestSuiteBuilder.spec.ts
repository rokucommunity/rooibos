// import * as chai from 'chai';
// import * as fs from 'fs-extra';

// import { expect } from 'chai';

// import { getFeedbackErrors, resetFeedback } from './Feedback';
// import { Tag } from './Tag';
// import { TestSuiteBuilder } from './TestSuiteBuilder';
// import { makeFile } from './TestUtils';
// import { createProcessorConfig } from './ProcessorConfig';
// import { RooibosProcessor } from './RooibosProcessor';

// const chaiSubset = require('chai-subset');

// chai.use(chaiSubset);
// let builder: TestSuiteBuilder;
// let sourcePath = 'src/test/stubProject';
// let targetPath = 'build';
// let specDir = 'build/source/tests/specs';

// function clearFiles() {
//   fs.removeSync(targetPath);
// }

// function copyFiles(alternatePath = null) {
//   try {
//     fs.copySync(alternatePath || sourcePath, targetPath);
//   } catch (err) {
//     console.error(err);
//   }
// }

// describe('TestSuiteBuilder tests ', function() {
//   beforeEach(() => {
//     builder = new TestSuiteBuilder(50, false);
//   });

//   describe('Initialization', function() {
//     it('correctly sets source paths and config', function() {
//       expect(builder.maxLinesWithoutSuiteDirective).to.equal(50);
//     });
//   });

//   describe('getFunctionFromLine', function() {
//     it('checks non function lines', () => {
//       expect(builder.getFunctionFromLine('')).to.be.null;
//       expect(builder.getFunctionFromLine('    ')).to.be.null;
//       expect(builder.getFunctionFromLine(' m.this  = "someValue')).to.be.null;
//       expect(builder.getFunctionFromLine(`'   function long_word_Different1(with Args) as void`)).to.be.null;
//       expect(builder.getFunctionFromLine(`'function foo() as void`)).to.be.null;
//     });

//     it('checks function lines', () => {
//       expect(builder.getFunctionFromLine('function foo() as void')).to.equal('foo');
//       expect(builder.getFunctionFromLine('sub foo() as void')).to.equal('foo');
//       expect(builder.getFunctionFromLine('   sub foo() as void')).to.equal('foo');
//       expect(builder.getFunctionFromLine('   function foo() as void')).to.equal('foo');
//       expect(builder.getFunctionFromLine('   function long_word_Different1() as void')).to.equal('long_word_Different1');
//       expect(builder.getFunctionFromLine('   function long_word_Different1(with Args) as void')).to.equal('long_word_Different1');
//     });
//   });

//   describe('getTagText', function() {
//     it('no text/not a tag', () => {
//       expect(builder.getTagText(`@TestSuite`, Tag.TEST_SUITE)).to.be.empty;
//       expect(builder.getTagText(`NOT`, Tag.TEST_SUITE)).to.be.empty;
//     });

//     it('has text and has tag', () => {
//       expect(builder.getTagText(`@TestSuite someText`, Tag.TEST_SUITE)).to.equal(`someText`);
//       expect(builder.getTagText(`@TestSuite someText here`, Tag.TEST_SUITE)).to.equal(`someText here`);
//       expect(builder.getTagText(`@TestSuite     someText here2`, Tag.TEST_SUITE)).to.equal(`someText here2`);
//     });
//   });

//   describe('processFile', function() {
//     beforeEach(() => {
//       clearFiles();
//       copyFiles();
//     });

//     it('ignores null file descriptor', () => {
//       let testSuite = builder.processFile(null);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.false;
//     });

//     it('ignores empty file contents', () => {
//       let file = makeFile(`source`, `test.brs`);
//       file.setFileContents('');
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.false;
//     });

//     it('processes valid test file', () => {
//       let file = makeFile(specDir, `VideoModuleTests.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//     });

//     it('processes solo test suite', () => {
//       let file = makeFile(specDir, `soloSuite.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//       expect(testSuite.isSolo).to.be.true;
//     });

//     it('processes solo group', () => {
//       let file = makeFile(specDir, `soloGroup.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//       expect(testSuite.hasSoloGroups).to.be.true;
//     });

//     it('processes solo test', () => {
//       let file = makeFile(specDir, `soloTest.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//       expect(testSuite.hasSoloTests).to.be.true;
//     });

//     it('simple params', () => {
//       let file = makeFile(specDir, `paramsTest.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//       expect(testSuite.testGroups[0].testCases[0].expectedNumberOfParams).to.equal(2);
//       expect(testSuite.testGroups[0].testCases[0].rawParams.length).to.equal(2);

//       expect(testSuite.testGroups[0].filename).to.equal('paramsTest');
//       expect(testSuite.testGroups[0].testCases[1].expectedNumberOfParams).to.equal(2);
//       expect(testSuite.testGroups[0].testCases[1].rawParams.length).to.equal(2);
//     });

//     it('complex params', () => {
//       let file = makeFile(specDir, `complexParamsTests.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//       expect(testSuite.testGroups[0].soloTestCases[0].expectedNumberOfParams).to.equal(3);
//       expect(testSuite.testGroups[0].soloTestCases[0].rawParams.length).to.equal(3);

//       expect(testSuite.testGroups[0].soloTestCases[1].expectedNumberOfParams).to.equal(3);
//       expect(testSuite.testGroups[0].soloTestCases[1].rawParams.length).to.equal(3);
//     });

//     it('url params bug #40', () => {
//       let file = makeFile(specDir, `urlParams.brs`);
//       let testSuite = builder.processFile(file);
//       expect(testSuite).to.not.be.null;
//       expect(testSuite.isValid).to.be.true;
//       expect(testSuite.testGroups[0].testCases[0].expectedNumberOfParams).to.equal(3);
//       expect(testSuite.testGroups[0].testCases[0].rawParams.length).to.equal(3);
//       expect(testSuite.testGroups[0].testCases[0].rawParams[1].type).to.equal('http://101.rooibos.com');
//     });

//     describe('legacy support', function() {
//       beforeEach(() => {
//         builder = new TestSuiteBuilder(50, true);
//       });

//       it('parsing of tests and asserts', () => {
//         let file = makeFile(specDir, `legacyFrameworkTests.brs`);
//         let testSuite = builder.processFile(file);

//         expect(testSuite).to.not.be.null;
//         expect(testSuite.isValid).to.be.true;
//         expect(testSuite.hasSoloTests).to.be.false;
//         expect(testSuite.isSolo).to.be.false;
//         expect(testSuite.hasIgnoredTests).to.be.false;
//         expect(testSuite.isIgnored).to.be.false;
//         expect(testSuite.name).to.equal('MainTestSuite');
//         expect(testSuite.testGroups[0].filename).to.equal('legacyFrameworkTests');
//         expect(testSuite.testGroups[0].testCases.length).to.equal(7);
//         expect(testSuite.testGroups[0].testCases[2].funcName).to.equal('testcase__main_checkstreamformattype');
//         expect(testSuite.testGroups[0].testCases[2].name).to.equal('CheckStreamFormatType');
//         expect(testSuite.testGroups[0].testCases[2].lineNumber).to.equal(79);
//         expect(testSuite.testGroups[0].testCases[2].assertLineNumberMap['0']).to.equal(81);
//         expect(testSuite.testGroups[0].testCases[2].assertLineNumberMap['1']).to.equal(82);
//         expect(testSuite.testGroups[0].testCases[2].assertLineNumberMap['2']).to.equal(83);
//       });

//       it('parsing of ignored test', () => {
//         let file = makeFile(specDir, `legacyFrameworkTests_isIgnored.brs`);
//         let testSuite = builder.processFile(file);

//         expect(testSuite).to.not.be.null;
//         expect(testSuite.isValid).to.be.true;
//         expect(testSuite.hasSoloTests).to.be.false;
//         expect(testSuite.isSolo).to.be.false;
//         expect(testSuite.hasIgnoredTests).to.be.false;
//         expect(testSuite.isIgnored).to.be.true;
//         expect(testSuite.name).to.equal('MainTestSuite');
//         expect(testSuite.testGroups[0].testCases.length).to.equal(7);
//       });

//       it('parsing of solo', () => {
//         let file = makeFile(specDir, `legacyFrameworkTests_isSolo.brs`);
//         let testSuite = builder.processFile(file);

//         expect(testSuite).to.not.be.null;
//         expect(testSuite.isValid).to.be.true;
//         expect(testSuite.hasSoloTests).to.be.false;
//         expect(testSuite.isSolo).to.be.true;
//         expect(testSuite.hasIgnoredTests).to.be.false;
//         expect(testSuite.isIgnored).to.be.false;
//         expect(testSuite.name).to.equal('MainTestSuite');
//         expect(testSuite.testGroups[0].testCases.length).to.equal(7);
//       });

//       it('parsing of solo tests', () => {
//         let file = makeFile(specDir, `legacyFrameworkTests_solos.brs`);
//         let testSuite = builder.processFile(file);

//         expect(testSuite).to.not.be.null;
//         expect(testSuite.isValid).to.be.true;
//         expect(testSuite.hasSoloTests).to.be.true;
//         expect(testSuite.isSolo).to.be.true;
//         expect(testSuite.hasIgnoredTests).to.be.false;
//         expect(testSuite.isIgnored).to.be.false;
//         expect(testSuite.name).to.equal('MainTestSuite');
//         expect(testSuite.testGroups[0].testCases.length).to.equal(5);
//         expect(testSuite.testGroups[0].soloTestCases.length).to.equal(2);
//         expect(testSuite.testGroups[0].soloTestCases[1].funcName).to.equal('testcase__main_checkstreamformattype');
//         expect(testSuite.testGroups[0].soloTestCases[1].name).to.equal('CheckStreamFormatType');
//         expect(testSuite.testGroups[0].soloTestCases[1].lineNumber).to.equal(103);
//       });

//       it('parsing of ignored tests', () => {
//         let file = makeFile(specDir, `legacyFrameworkTests_ignoredTests.brs`);
//         let testSuite = builder.processFile(file);

//         expect(testSuite).to.not.be.null;
//         expect(testSuite.isValid).to.be.true;
//         expect(testSuite.hasSoloTests).to.be.false;
//         expect(testSuite.isSolo).to.be.false;
//         expect(testSuite.hasIgnoredTests).to.be.true;
//         expect(testSuite.isIgnored).to.be.false;
//         expect(testSuite.name).to.equal('MainTestSuite');
//         expect(testSuite.testGroups[0].testCases.length).to.equal(5);
//         expect(testSuite.testGroups[0].soloTestCases.length).to.equal(0);
//         expect(testSuite.testGroups[0].ignoredTestCases.length).to.equal(2);
//         expect(testSuite.testGroups[0].ignoredTestCases[0].funcName).to.equal('testcase__main_checkdatacount');
//         expect(testSuite.testGroups[0].ignoredTestCases[0].name).to.equal('CheckDataCount');
//         expect(testSuite.testGroups[0].ignoredTestCases[1].funcName).to.equal('testcase__main_checkstreamformattype');
//         expect(testSuite.testGroups[0].ignoredTestCases[1].name).to.equal('CheckStreamFormatType');
//       });

//       it('parsing of setup and teardown', () => {
//         let file = makeFile(specDir, `legacyFrameworkTests_setupAndTearDown.brs`);
//         let testSuite = builder.processFile(file);

//         expect(testSuite).to.not.be.null;
//         expect(testSuite.isValid).to.be.true;
//         expect(testSuite.name).to.equal('MainTestSuite');
//         expect(testSuite.setupFunctionName).to.equal('MainTestSuite__SetUp');
//         expect(testSuite.tearDownFunctionName).to.equal('MainTestSuite__TearDown');
//         expect(testSuite.testGroups[0].testCases.length).to.equal(7);
//       });

//     });

//     describe('duplicates', function() {
//       beforeEach(() => {
//         clearFiles();
//         copyFiles('src/test/stubProjectDuplicateTestCases');
//         resetFeedback();
//       });

//       it('errors on duplicate testCase name', () => {
//         let file = makeFile(specDir, `soloGroup.brs`);
//         file.getFileContents();
//         let testSuite = builder.processFile(file);
//         let errors = getFeedbackErrors();
//         expect(errors).to.not.be.empty;
//       });

//       it('errors on duplicate testGroup name', () => {
//         let file = makeFile(specDir, `soloSuite.brs`);
//         file.getFileContents();
//         let testSuite = builder.processFile(file);
//         let errors = getFeedbackErrors();
//         expect(errors).to.not.be.empty;
//       });
//       it('errors on duplicate suite name', () => {
//         builder = new TestSuiteBuilder(50, false);

//         let file = makeFile(specDir, `urlParams.brs`);
//         builder.processFile(file);
//         let errors = getFeedbackErrors();
//         expect(errors).to.be.empty;

//         file = makeFile(specDir, `urlParams.brs`);
//         builder.processFile(file);

//         errors = getFeedbackErrors();
//         expect(errors).to.not.be.empty;
//       });

//     });

//   });
//   describe('isTag', function() {
//     beforeEach(() => {
//       builder = new TestSuiteBuilder(50, false);
//     });
//     it('identifies only tag', function() {
//       expect(builder.isTag(`'@Only`, Tag.SOLO)).to.be.true;
//       expect(builder.isTag(`'@only`, Tag.SOLO)).to.be.true;
//       expect(builder.isTag(`   '@only`, Tag.SOLO)).to.be.true;
//     });
//   });
//   describe('getTagText with spaces', function() {
//     beforeEach(() => {
//       builder = new TestSuiteBuilder(50, false);
//     });
//     it('identifies only tag', function() {
//       expect(builder.getTagText(`'@Only some values`, Tag.SOLO)).to.equal('some values');
//       expect(builder.getTagText(`'@only some values`, Tag.SOLO)).to.equal('some values');
//       expect(builder.getTagText(`   '@Only some values`, Tag.SOLO)).to.equal('some values');
//       expect(builder.getTagText(`   '@only some values`, Tag.SOLO)).to.equal('some values');
//     });
//   });
//   describe('test local projects:  - skip these in ci', function() {
//     beforeEach(() => {
//       builder = new TestSuiteBuilder(50, false);
//     });
//     it('smc', async function() {
//       let testFiles = [];
//       if (process.env.TEST_FILES_PATTERN) {
//         console.log('using overridden test files');
//         testFiles = JSON.parse(process.env.TEST_FILES_PATTERN);
//       } else {
//         testFiles = [
//           '**/tests/**/*.bs',
//           '**/tests/**/*.brs',
//           '!**/rooibosDist.brs',
//           '!**/rooibosFunctionMap.brs',
//           '!**/TestsScene.brs'
//         ];
//       }

//       let config = createProcessorConfig({
//         projectPath: '/home/george/hope/smc/pot-smithsonian-channel-roku-xm/build',
//         showFailuresOnly: true,
//         testsFilePattern: testFiles
//       });
//       let processor = new RooibosProcessor(config);
//       await processor.processFiles();
//       console.log('done');
//     });
//   });
// });
