import type { BrsFile, CallExpression, MethodStatement, ClassStatement, ExpressionStatement, FunctionStatement } from 'brighterscript';
import { CallfuncExpression, DiagnosticSeverity, DottedGetExpression, Position, Program, ProgramBuilder, util, standardizePath as s, PrintStatement } from 'brighterscript';
import { expect } from 'chai';
import { RooibosPlugin } from './plugin';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import undent from 'undent';
import { SourceMapConsumer } from 'source-map';
import { getFileLookups } from './lib/rooibos/Utils';
let tmpPath = s`${process.cwd()}/.tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingFolderPath = s`${tmpPath}/staging`;
const version = fsExtra.readJsonSync(__dirname + '/../package.json').version;

describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;

    function setupProgram(options) {
        fsExtra.ensureDirSync(_stagingFolderPath);
        fsExtra.ensureDirSync(_rootDir);

        plugin = new RooibosPlugin();
        builder = new ProgramBuilder();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        builder.options = util.normalizeAndResolveConfig(options);
        builder.program = new Program(builder.options);
        program = builder.program;
        program.plugins.add(plugin);
        program.createSourceScope(); //ensure source scope is created
        plugin.beforeProgramCreate({ builder: builder });
        plugin.afterProgramCreate({ program: program, builder: builder });
    }

    function destroyProgram() {
        builder.dispose();
        program.dispose();
        fsExtra.removeSync(tmpPath);
    }

    beforeEach(() => {
        setupProgram({
            rootDir: _rootDir,
            stagingDir: _stagingFolderPath,
            //workaround for bsc bug where outDir does not fall back to stagingDir
            outDir: _stagingFolderPath,
            rooibos: {
                isGlobalMethodMockingEnabled: true
            }
        });
    });

    afterEach(() => {
        destroyProgram();
    });

    describe('basic tests', () => {
        it('does not find tests with no annotations', () => {
            program.setFile('source/test.spec.bs', `
                class notATest
                end class
            `);
            program.validate();
            const diagnostics = program.getDiagnostics();
            expect(diagnostics).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });

        it('finds a basic suite', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")

                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
        });

        it('finds a suite name, only', () => {
            program.setFile('source/test.spec.bs', `
                @only
                @suite("named")
                class ATest
                    @describe("groupA")

                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            let suite = plugin.session.sessionInfo.testSuitesToRun[0];
            expect(suite.name).to.equal('named');
            expect(suite.isSolo).to.be.true;
        });

        it('finds and combines onlys', () => {
            program.setFile('source/test.spec.bs', `
                @only
                @suite("named1")
                class ATest
                    @describe("groupA")

                    @it("is testA1")
                    function Test()
                    end function

                    @it("is testA2")
                    function Test()
                    end function

                    @describe("groupAA")

                    @it("is testA1")
                    function Test()
                    end function

                    @it("is testA2")
                    function Test()
                    end function

                end class

                @suite("named2")
                class BTest
                    @only
                    @describe("groupB")

                    @it("is testB1")
                    function Test()
                    end function

                    @it("is testB2")
                    function Test()
                    end function

                    @describe("groupBB")

                    @it("is testBB1")
                    function Test()
                    end function

                    @it("is testBB2")
                    function Test()
                    end function

                end class

                @suite("named3")
                class CTest
                    @describe("groupC")

                    @it("is testC1")
                    function Test()
                    end function

                    @only
                    @it("is testC2")
                    function Test()
                    end function

                    @describe("groupCC")

                    @it("is testCC1")
                    function Test()
                    end function

                    @it("is testCC2")
                    function Test()
                    end function

                end class

                @suite("named4")
                class DTest
                    @only
                    @describe("groupD")

                    @it("is testD1")
                    function Test()
                    end function

                    @only
                    @it("is testD2")
                    function Test()
                    end function

                    @only
                    @describe("groupDD")

                    @it("is testDD1")
                    function Test()
                    end function

                    @it("is testDD2")
                    function Test()
                    end function

                end class

                @only
                @suite("named5")
                class ETest
                    @only
                    @describe("groupE")

                    @it("is testE1")
                    function Test()
                    end function

                    @only
                    @it("is testE2")
                    function Test()
                    end function

                end class

                @ignore
                @suite("named6")
                class FTest
                    @describe("groupF")

                    @it("is testF1")
                    function Test()
                    end function

                    @it("is testF2")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.length(5);

            const testSuitesToRun = plugin.session.sessionInfo.testSuitesToRun;

            let suiteOne = testSuitesToRun[0];
            let suiteOneGroups = [...suiteOne.testGroups.values()];
            let suiteOneTests = [];
            for (let group of suiteOneGroups) {
                suiteOneTests.push(...group.testCases);
            }
            expect(suiteOne.name).to.equal('named1');
            expect(suiteOneGroups).to.be.length(2);
            expect(suiteOneTests).to.be.length(4);
            expect(suiteOneGroups.map(group => group.name)).to.eql(['groupA', 'groupAA']);
            expect(suiteOneTests.map(test => test.name)).to.eql(['is testA1', 'is testA2', 'is testA1', 'is testA2']);
            expect(suiteOne.isSolo).to.be.true;
            expect(suiteOne.hasSoloGroups).to.be.false;
            expect(suiteOne.hasSoloTests).to.be.false;

            let suiteTwo = testSuitesToRun[1];
            let suiteTwoGroups = [...suiteTwo.testGroups.values()];
            let suiteTwoTests = [];
            for (let group of suiteTwoGroups) {
                suiteTwoTests.push(...group.testCases);
            }
            expect(suiteTwo.name).to.equal('named2');
            expect(suiteTwoGroups).to.be.length(2);
            expect(suiteTwoTests).to.be.length(4);
            expect(suiteTwoGroups.filter(group => group.isIncluded).map(group => group.name)).to.eql(['groupB']);
            expect(suiteTwoTests.filter(test => test.isIncluded).map(test => test.name)).to.eql(['is testB1', 'is testB2']);
            expect(suiteTwo.isSolo).to.be.false;
            expect(suiteTwo.hasSoloGroups).to.be.true;
            expect(suiteTwo.hasSoloTests).to.be.false;

            let suiteThree = testSuitesToRun[2];
            let suiteThreeGroups = [...suiteThree.testGroups.values()];
            let suiteThreeTests = [];
            for (let group of suiteThreeGroups) {
                suiteThreeTests.push(...group.testCases);
            }
            expect(suiteThree.name).to.equal('named3');
            expect(suiteThreeGroups).to.be.length(2);
            expect(suiteThreeTests).to.be.length(4);
            expect(suiteThreeGroups.filter(group => group.isIncluded).map(group => group.name)).to.eql(['groupC']);
            expect(suiteThreeTests.filter(test => test.isIncluded).map(test => test.name)).to.eql(['is testC2']);
            expect(suiteThree.isSolo).to.be.false;
            expect(suiteThree.hasSoloGroups).to.be.false;
            expect(suiteThree.hasSoloTests).to.be.true;

            let suiteFour = testSuitesToRun[3];
            let suiteFourGroups = [...suiteFour.testGroups.values()];
            let suiteFourTests = [];
            for (let group of suiteFourGroups) {
                suiteFourTests.push(...group.testCases);
            }
            expect(suiteFour.name).to.equal('named4');
            expect(suiteFourGroups).to.be.length(2);
            expect(suiteFourTests).to.be.length(4);
            expect(suiteFourGroups.filter(group => group.isIncluded).map(group => group.name)).to.eql(['groupD', 'groupDD']);
            expect(suiteFourTests.filter(test => test.isIncluded).map(test => test.name)).to.eql(['is testD2', 'is testDD1', 'is testDD2']);
            expect(suiteFour.isSolo).to.be.false;
            expect(suiteFour.hasSoloGroups).to.be.true;
            expect(suiteFour.hasSoloTests).to.be.true;

            let suiteFive = testSuitesToRun[4];
            let suiteFiveGroups = [...suiteFive.testGroups.values()];
            let suiteFiveTests = [];
            for (let group of suiteFiveGroups) {
                suiteFiveTests.push(...group.testCases);
            }
            expect(suiteFive.name).to.equal('named5');
            expect(suiteFiveGroups).to.be.length(1);
            expect(suiteFiveTests).to.be.length(2);
            expect(suiteFiveGroups.filter(group => group.isIncluded).map(group => group.name)).to.eql(['groupE']);
            expect(suiteFiveTests.filter(test => test.isIncluded).map(test => test.name)).to.eql(['is testE2']);
            expect(suiteFive.isSolo).to.be.true;
            expect(suiteFive.hasSoloGroups).to.be.true;
            expect(suiteFive.hasSoloTests).to.be.true;
        });

        it('finds a @async', () => {
            program.setFile('source/test.spec.bs', `
                @async
                @suite()
                class ATest
                    @describe("groupA")

                    @async
                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            let suite = plugin.session.sessionInfo.testSuitesToRun[0];
            expect(suite.name).to.equal('ATest');
            expect(suite.isAsync).to.be.true;
            expect(suite.asyncTimeout).to.equal(60000);
            let test = suite.testGroups.get('groupA').testCases[0];
            expect(test.isAsync).to.be.true;
            expect(test.asyncTimeout).to.equal(2000);
        });

        it('finds a @async and applies timeout override', () => {
            program.setFile('source/test.spec.bs', `
                @async(1)
                @suite("named")
                class ATest
                @describe("groupA")

                    @async(2)
                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            let suite = plugin.session.sessionInfo.testSuitesToRun[0];
            expect(suite.name).to.equal('named');
            expect(suite.isAsync).to.be.true;
            expect(suite.asyncTimeout).to.equal(1);
            let test = suite.testGroups.get('groupA').testCases[0];
            expect(test.isAsync).to.be.true;
            expect(test.asyncTimeout).to.equal(2);
        });

        it('ignores a suite', () => {
            program.setFile('source/test.spec.bs', `
                @ignore
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")

                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun.length).to.be.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(1);
            expect([...plugin.session.sessionInfo.testSuites.entries()][0][1].isIgnored).to.equal(true);
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].isIgnored).to.equal(true);
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].testCases[0].isIgnored).to.equal(true);
        });

        it('ignores a group', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @ignore
                    @describe("groupA")

                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun.length).to.be.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(1);
            expect([...plugin.session.sessionInfo.testSuites.entries()][0][1].isIgnored).to.equal(false);
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].isIgnored).to.equal(true);
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].testCases[0].isIgnored).to.equal(true);
        });

        it('ignores a test', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")

                    @ignore
                    @it("is test1")
                    function Test()
                    end function

                end class
            `);

            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun.length).to.be.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(1);
            expect([...plugin.session.sessionInfo.testSuites.entries()][0][1].isIgnored).to.equal(false);
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].isIgnored).to.equal(false);
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].testCases[0].isIgnored).to.equal(true);
        });

        it('multiple groups', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")

                    @it("is test1")
                    function Test_1()
                    end function

                    @describe("groupB")

                    @it("is test1")
                    function Test_2()
                    end function

                    @it("is test2")
                    function Test_3()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            let suite = plugin.session.sessionInfo.testSuitesToRun[0];
            expect(suite.getTestGroups()[0].testCases).to.have.length(1);
        });

        it('duplicate test name', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")

                    @it("is test1")
                    function Test_1()
                    end function

                    @describe("groupB")

                    @it("is test1")
                    function Test_2()
                    end function

                    @it("is test1")
                    function Test_3()
                    end function

                end class
            `);
            program.validate();

            expect(program.getDiagnostics()).to.be.empty;
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].testCases[0].funcName).to.equal('rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_0');
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][0][1].testCases[0].name).to.equal('is test1');
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][1][1].testCases[0].funcName).to.equal('rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_1');
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][1][1].testCases[0].name).to.equal('is test1');
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][1][1].testCases[1].funcName).to.equal('rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_2');
            expect([...[...plugin.session.sessionInfo.testSuites.entries()][0][1].testGroups.entries()][1][1].testCases[1].name).to.equal('is test1');
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.length(1);
        });

        it('empty test group', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.not.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });

        it('multiple test group annotations - same name', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @describe("groupA")
                    @it("is test1")
                    function Test_3()
                    end function
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.not.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });

        it('params test with negative numbers', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("is test1")
                    @params(100,100)
                    @params(100,-100)
                    @params(-100,100)
                    @params(-100,-100)
                    function Test_3(a, b)
                    end function
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
        });

        it('updates test name to match name of annotation', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("is test1")
                    function test()
                    end function
                    @it("is test2")
                    function test()
                    end function
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
        });

        it('updates test name to match name of annotation - with params', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("is test1")
                    function test()
                    end function
                    @it("is test2")
                    @params(1)
                    @params(2)
                    function test(arg)
                    end function
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
        });

        it('multiple test group annotations - different name', () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @describe("groupB")
                    @it("is test1")
                    function Test_3()
                    end function
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.not.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });

        it('sanity check for sourcemaps', async () => {
            await testSourcemapLocations(`
                sub main()
                    print "hello"
                end sub
            `, `
                sub main()
                    Rooibos_init("RooibosScene")
                    print "hello"
                end sub
                '//# sourceMappingURL=./test.spec.brs.map
            `, [
                // print "h|ello" => print |"hello"
                { dest: [2, 12], src: [2, 26] }
            ]);
        });

        it('produces proper sourcemaps', async () => {
            await testSourcemapLocations(`
                @suite
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @describe("groupB")
                    @it("is test1")
                    function Test_3()
                        number = 123
                        m.assertEqual("123", \`alpha-\${number}-beta\`)
                        m.assertEqual(123, 123)
                    end function
                end class
            `, `
                function __ATest_builder()
                    instance = __rooibos_BaseTestSuite_builder()
                    instance.super0_new = instance.new
                    instance.new = sub()
                        m.super0_new()
                    end sub
                    instance.rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_0 = function()
                        number = 123
                        m.assertEqual("123", ("alpha-" + bslib_toString(number) + "-beta"))
                        m.assertEqual(123, 123)
                    end function
                    return instance
                end function
                function ATest()
                    instance = __ATest_builder()
                    instance.new()
                    return instance
                end function
                '//# sourceMappingURL=./test.spec.brs.map
            `, [
                // m.assert|Equal("123", ("alpha-" + bslib_toString(number) + "-beta"))    =>    m.|assertEqual("123", `alpha-${number}-beta`)
                { dest: [8, 16], src: [8, 26] },
                // m.assert|Equal(123, 123) => m.|assertEqual(123, 123)
                { dest: [9, 16], src: [9, 26] }

            ]);
        });

        it('test full transpile', async () => {
            plugin.afterProgramCreate({ program: program, builder: builder });
            // program.validate();
            const file = program.setFile<BrsFile>('source/test.spec.bs', `
                @suite
                class ATest extends rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("is test1")
                    @slow(1000)
                    function Test_3()
                        m.assertEqual(1, 1)
                        if 1 = 1
                            m.assertEqual(2, 2)
                            if 2 = 2
                                m.assertTrue(false)
                            end if
                        end if
                    end function
                    @it("is test2")
                    sub Test_4()
                        m.assertEqual(1, 1)
                        if 1 = 1
                            m.assertEqual(2, 2)
                            if 2 = 2
                                m.assertTrue(false)
                            end if
                        end if
                    end sub
                end class
            `);
            program.validate();
            await builder.build();
            expect(builder.getDiagnostics()).to.have.length(0);
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            expect(plugin.session.sessionInfo.suitesCount).to.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(2);

            expect(
                getContents('rooibosMain.brs')
            ).to.eql(undent`
                function main()
                    Rooibos_init("RooibosScene")
                end function
            `);
            expect(
                getContents('test.spec.brs')
            ).to.eql(undent`
                function __ATest_builder()
                    instance = __rooibos_BaseTestSuite_builder()
                    instance.super0_new = instance.new
                    instance.new = sub()
                        m.super0_new()
                    end sub
                    instance.rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_0 = function()
                        m.currentAssertLineNumber = 8
                        m.assertEqual(1, 1)
                        if m.currentResult?.isFail = true then
                            m.done()
                            return invalid
                        end if
                        if 1 = 1
                            m.currentAssertLineNumber = 10
                            m.assertEqual(2, 2)
                            if m.currentResult?.isFail = true then
                                m.done()
                                return invalid
                            end if
                            if 2 = 2
                                m.currentAssertLineNumber = 12
                                m.assertTrue(false)
                                if m.currentResult?.isFail = true then
                                    m.done()
                                    return invalid
                                end if
                            end if
                        end if
                    end function
                    instance.rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_1 = sub()
                        m.currentAssertLineNumber = 18
                        m.assertEqual(1, 1)
                        if m.currentResult?.isFail = true then
                            m.done()
                            return
                        end if
                        if 1 = 1
                            m.currentAssertLineNumber = 20
                            m.assertEqual(2, 2)
                            if m.currentResult?.isFail = true then
                                m.done()
                                return
                            end if
                            if 2 = 2
                                m.currentAssertLineNumber = 22
                                m.assertTrue(false)
                                if m.currentResult?.isFail = true then
                                    m.done()
                                    return
                                end if
                            end if
                        end if
                    end sub
                    instance.super0_getTestSuiteData = instance.getTestSuiteData
                    instance.getTestSuiteData = function()
                        return {
                            name: "ATest"
                            isSolo: false
                            noCatch: false
                            isIgnored: false
                            isAsync: false
                            pkgPath: "${s`source/test.spec.brs`}"
                            destPath: "${s`source/test.spec.bs`}"
                            filePath: "${s`${tmpPath}/rootDir/source/test.spec.bs`}"
                            lineNumber: 3
                            valid: true
                            hasFailures: false
                            hasSoloTests: false
                            hasIgnoredTests: false
                            hasSoloGroups: false
                            setupFunctionName: ""
                            tearDownFunctionName: ""
                            beforeEachFunctionName: ""
                            afterEachFunctionName: ""
                            isNodeTest: false
                            isAsync: false
                            asyncTimeout: 60000
                            nodeName: ""
                            generatedNodeName: "ATest"
                            testGroups: [
                                {
                                    name: "groupA"
                                    isSolo: false
                                    isIgnored: false
                                    isAsync: false
                                    filename: "${s`source/test.spec.brs`}"
                                    lineNumber: 4
                                    setupFunctionName: ""
                                    tearDownFunctionName: ""
                                    beforeEachFunctionName: ""
                                    afterEachFunctionName: ""
                                    testCases: [
                                        {
                                            isSolo: false
                                            noCatch: false
                                            funcName: "rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_0"
                                            isIgnored: false
                                            isAsync: false
                                            asyncTimeout: 2000
                                            slow: 1000
                                            isParamTest: false
                                            name: "is test1"
                                            lineNumber: 7
                                            paramLineNumber: 0
                                            assertIndex: 0
                                            rawParams: invalid
                                            paramTestIndex: 0
                                            expectedNumberOfParams: 0
                                            isParamsValid: true
                                        }
                                        {
                                            isSolo: false
                                            noCatch: false
                                            funcName: "rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_1"
                                            isIgnored: false
                                            isAsync: false
                                            asyncTimeout: 2000
                                            slow: 75
                                            isParamTest: false
                                            name: "is test2"
                                            lineNumber: 17
                                            paramLineNumber: 0
                                            assertIndex: 0
                                            rawParams: invalid
                                            paramTestIndex: 0
                                            expectedNumberOfParams: 0
                                            isParamsValid: true
                                        }
                                    ]
                                }
                            ]
                        }
                    end function
                    return instance
                end function
                function ATest()
                    instance = __ATest_builder()
                    instance.new()
                    return instance
                end function
            `);

            //verify the AST was restored after transpile
            const cls = file.ast.statements[0] as ClassStatement;
            expect(cls.body.find((x: MethodStatement) => {
                return x.tokens.name?.text.toLowerCase() === 'getTestSuiteData'.toLowerCase();
            })).not.to.exist;
        });

        it('handles groups that start with numbers', async () => {
            plugin.afterProgramCreate({ program: program, builder: builder });
            // program.validate();
            const file = program.setFile<BrsFile>('source/test.spec.bs', `
                @suite
                class ATest extends rooibos.BaseTestSuite
                    @describe("1groupA")
                    @it("is test1")
                    @slow(1000)
                    function Test_3()
                    end function
                end class
            `);
            program.validate();
            await builder.build();
            console.log(builder.getDiagnostics());
            expect(builder.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            expect(plugin.session.sessionInfo.suitesCount).to.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(1);

            expect(
                getContents('rooibosMain.brs')
            ).to.eql(undent`
                function main()
                    Rooibos_init("RooibosScene")
                end function
            `);
            expect(
                getContents('test.spec.brs')
            ).to.eql(undent`
                function __ATest_builder()
                    instance = __rooibos_BaseTestSuite_builder()
                    instance.super0_new = instance.new
                    instance.new = sub()
                        m.super0_new()
                    end sub
                    instance.rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_0 = function()
                    end function
                    instance.super0_getTestSuiteData = instance.getTestSuiteData
                    instance.getTestSuiteData = function()
                        return {
                            name: "ATest"
                            isSolo: false
                            noCatch: false
                            isIgnored: false
                            isAsync: false
                            pkgPath: "${s`source/test.spec.brs`}"
                            destPath: "${s`source/test.spec.bs`}"
                            filePath: "${s`${tmpPath}/rootDir/source/test.spec.bs`}"
                            lineNumber: 3
                            valid: true
                            hasFailures: false
                            hasSoloTests: false
                            hasIgnoredTests: false
                            hasSoloGroups: false
                            setupFunctionName: ""
                            tearDownFunctionName: ""
                            beforeEachFunctionName: ""
                            afterEachFunctionName: ""
                            isNodeTest: false
                            isAsync: false
                            asyncTimeout: 60000
                            nodeName: ""
                            generatedNodeName: "ATest"
                            testGroups: [
                                {
                                    name: "1groupA"
                                    isSolo: false
                                    isIgnored: false
                                    isAsync: false
                                    filename: "${s`source/test.spec.brs`}"
                                    lineNumber: 4
                                    setupFunctionName: ""
                                    tearDownFunctionName: ""
                                    beforeEachFunctionName: ""
                                    afterEachFunctionName: ""
                                    testCases: [
                                        {
                                            isSolo: false
                                            noCatch: false
                                            funcName: "rooiboos_test_case_0d635a9477c4624180ef87bef352afd3_0"
                                            isIgnored: false
                                            isAsync: false
                                            asyncTimeout: 2000
                                            slow: 1000
                                            isParamTest: false
                                            name: "is test1"
                                            lineNumber: 7
                                            paramLineNumber: 0
                                            assertIndex: 0
                                            rawParams: invalid
                                            paramTestIndex: 0
                                            expectedNumberOfParams: 0
                                            isParamsValid: true
                                        }
                                    ]
                                }
                            ]
                        }
                    end function
                    return instance
                end function
                function ATest()
                    instance = __ATest_builder()
                    instance.new()
                    return instance
                end function
            `);

            //verify the AST was restored after transpile
            const cls = file.ast.statements[0] as ClassStatement;
            expect(cls.body.find((x: MethodStatement) => {
                return x.tokens.name?.text.toLowerCase() === 'getTestSuiteData'.toLowerCase();
            })).not.to.exist;
        });

        it('test full transpile with complex params', async () => {
            plugin.afterProgramCreate({ program: program, builder: builder });
            // program.validate();
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest extends rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("is test1")
                    @params({"unknown_value": "color"})
                    function Test_3(arg)
                    end function
                end class
            `);
            program.validate();
            await builder.build();
            expect(builder.getDiagnostics()).to.have.length(0);
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            expect(plugin.session.sessionInfo.suitesCount).to.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(1);

            expect(
                getContents('rooibosMain.brs')
            ).to.eql(undent`
                function main()
                    Rooibos_init("RooibosScene")
                end function
            `);
        });

        it('adds launch hook to existing main function', async () => {
            plugin.afterProgramCreate({ program: program, builder: builder });
            // program.validate();
            const file = program.setFile<BrsFile>('source/main.bs', `
                sub main()
                    print "main"
                end sub
            `);
            program.validate();
            await builder.build();

            expect(
                getContents('main.brs')
            ).to.eql(undent`
                sub main()
                    Rooibos_init("RooibosScene")
                    print "main"
                end sub
            `);
            //the AST should not have been permanently modified
            const statements = (file.parser.ast.statements[0] as FunctionStatement).func.body.statements;
            expect(statements).to.be.lengthOf(1);
            expect(statements[0]).to.be.instanceof(PrintStatement);
        });

        it('adds launch hook to existing main function with different case', async () => {
            plugin.afterProgramCreate({ program: program, builder: builder });
            // program.validate();
            const file = program.setFile<BrsFile>('source/main.bs', `
                sub Main()
                    print "main"
                end sub
            `);
            program.validate();
            await builder.build();

            expect(
                getContents('main.brs')
            ).to.eql(undent`
                sub Main()
                    Rooibos_init("RooibosScene")
                    print "main"
                end sub
            `);
            //the AST should not have been permanently modified
            const statements = (file.parser.ast.statements[0] as FunctionStatement).func.body.statements;
            expect(statements).to.be.lengthOf(1);
            expect(statements[0]).to.be.instanceof(PrintStatement);
        });


        it('adds launch hook with custom scene', async () => {
            setupProgram({
                rootDir: _rootDir,
                stagingDir: _stagingFolderPath,
                //workaround for bsc bug where outDir does not fall back to stagingDir
                outDir: _stagingFolderPath,
                rooibos: {
                    testSceneName: 'CustomRooibosScene'
                }
            });

            const file = program.setFile<BrsFile>('source/main.bs', `
                sub main()
                    print "main"
                end sub
            `);
            program.validate();
            await builder.build();

            expect(
                getContents('main.brs')
            ).to.eql(undent`
                sub main()
                    Rooibos_init("CustomRooibosScene")
                    print "main"
                end sub
            `);
            //the AST should not have been permanently modified
            const statements = (file.parser.ast.statements[0] as FunctionStatement).func.body.statements;
            expect(statements).to.be.lengthOf(1);
            expect(statements[0]).to.be.instanceof(PrintStatement);
        });

        describe('expectCalled transpilation', () => {
            it('correctly transpiles call funcs', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectCalled(m.thing@.getFunction())
                            m.expectCalled(m.thing@.getFunction(), "return")
                            m.expectCalled(m.thing@.getFunction("a", "b"))
                            m.expectCalled(m.thing@.getFunction("a", "b"), "return")
                        end function

                        thing as roSGNode
                    end class
                `);
                program.validate();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const testContents = getTestFunctionContents();
                expect(
                    testContents
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                        "getFunction"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                        "getFunction"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                        "getFunction"
                        "a"
                        "b"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 10
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                        "getFunction"
                        "a"
                        "b"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });

            it('correctly transpiles func pointers', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectCalled(m.thing.getFunctionField)
                            m.expectCalled(m.thing.getFunctionField, "return")
                        end function
                        thing as Klass
                    end class

                    class Klass
                        function getFunctionField()
                        end function
                    end class
                `);
                program.validate();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "getFunctionField", m, "m.thing", invalid)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "getFunctionField", m, "m.thing", invalid, "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });

            it('correctly transpiles function invocations', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectCalled(m.thing.getFunction())
                            m.expectCalled(m.thing.getFunction(), "return")
                            m.expectCalled(m.thing.getFunction("arg1", "arg2"))
                            m.expectCalled(m.thing.getFunction("arg1", "arg2"), "return")
                        end function
                        thing as Klass
                    end class

                    class Klass
                        function getFunction(arg1 = invalid, arg2 = invalid)
                        end function
                    end class
                `);
                program.validate();
                await builder.build();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics.filter((d) => d.code !== 'RBS2213')).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                const testContents = getTestFunctionContents();
                expect(
                    testContents
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                        "arg1"
                        "arg2"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 10
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                        "arg1"
                        "arg2"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });
            it('does not produce crashing code for subs', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        sub _()
                            m.expectCalled(m.thing.getFunction())
                            m.expectCalled(m.thing.getFunction(), "return")
                            m.expectCalled(m.thing.getFunction("arg1", "arg2"))
                            m.expectCalled(m.thing.getFunction("arg1", "arg2"), "return")
                        end sub
                        thing as Klass
                    end class

                    class Klass
                        function getFunction(arg1 = invalid, arg2 = invalid)
                        end function
                    end class
                `);
                program.validate();
                await builder.build();
                expect(program.getDiagnostics().filter((d) => d.code !== 'RBS2213')).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(
                    getTestSubContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return
                    end if
                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                        "arg1"
                        "arg2"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return
                    end if
                    m.currentAssertLineNumber = 10
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                        "arg1"
                        "arg2"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return
                    end if
                `);
            });

            it('does not break when validating again after a transpile', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectCalled(m.thing.getFunction())
                            m.expectCalled(m.thing.getFunction(), "return")
                            m.expectCalled(m.thing.getFunction("arg1", "arg2"))
                            m.expectCalled(m.thing.getFunction("arg1", "arg2"), "return")
                        end function
                        thing as Klass
                    end class

                    class Klass
                        function getFunction(arg1 = invalid, arg2 = invalid)
                        end function
                    end class
                `);
                program.validate();
                await builder.build();
                program.validate();
                expect(program.getDiagnostics().filter((d) => d.code !== 'RBS2213')).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                const testContents = getTestFunctionContents();
                expect(
                    testContents
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                        "arg1"
                        "arg2"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 10
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                        "arg1"
                        "arg2"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });

            it('correctly transpiles enums in assertions', async () => {
                program.setFile('source/test.spec.bs', `
                    namespace lib
                        enum myEnum
                            value = "value"
                        end enum
                    end namespace
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            b = { someValue: lib.myEnum.value}
                            m.assertEqual(b, { someValue: lib.myEnum.value})
                        end function
                    end class
                `);
                program.validate();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics).to.be.empty;
                // expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const testContents = getTestFunctionContents();
                expect(
                    testContents
                ).to.eql(undent`
                    b = {
                        someValue: "value"
                    }
                    m.currentAssertLineNumber = 13
                    m.assertEqual(b, {
                        someValue: "value"
                    })
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });

            it('correctly transpiles async asserts', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                            callback = sub()
                                b = { someValue: "value"}
                                m.testSuite.assertEqual(b, { someValue: "value"})
                            end sub
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                // expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                const testContents = getTestFunctionContents();
                expect(
                    testContents
                ).to.eql(undent`
                    callback = sub()
                        b = {
                            someValue: "value"
                        }
                        m.testSuite.currentAssertLineNumber = 9
                        m.testSuite.assertEqual(b, {
                            someValue: "value"
                        })
                        if m.testSuite.currentResult?.isFail = true then
                            m.testSuite.done()
                            return
                        end if
                    end sub
                `);
            });

            it('correctly transpiles function invocations - simple object', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            item = {id: "item"}
                            m.expectCalled(item.getFunction())
                            m.expectCalled(item.getFunction(), "return")
                            m.expectCalled(item.getFunction("arg1", "arg2"))
                            m.expectCalled(item.getFunction("arg1", "arg2"), "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const testContents = getTestFunctionContents();
                expect(
                    testContents
                ).to.eql(undent`
                    item = {
                        id: "item"
                    }
                    m.currentAssertLineNumber = 8
                    m._expectCalled(item, "getFunction", item, "item", [])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectCalled(item, "getFunction", item, "item", [], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 10
                    m._expectCalled(item, "getFunction", item, "item", [
                        "arg1"
                        "arg2"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 11
                    m._expectCalled(item, "getFunction", item, "item", [
                        "arg1"
                        "arg2"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });
            it('correctly transpiles global function calls', async () => {

                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            item = {id: "item"}
                            m.expectCalled(sayHello("arg1", "arg2"), "return")
                            m.expectCalled(sayHello())
                            m.expectCalled(sayHello(), "return")
                            m.expectCalled(sayHello("arg1", "arg2"))
                        end function
                    end class
                `);
                program.setFile('source/code.bs', `
                    function sayHello(firstName = "" as string, lastName = "" as string)
                        print firstName + " " + lastName
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const testText = getTestFunctionContents();
                expect(
                    testText
                ).to.eql(undent`
                    item = {
                        id: "item"
                    }
                    m.currentAssertLineNumber = 8
                    m._expectCalled(sayHello, "sayHello", invalid, invalid, [
                        "arg1"
                        "arg2"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectCalled(sayHello, "sayHello", invalid, invalid, [])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 10
                    m._expectCalled(sayHello, "sayHello", invalid, invalid, [], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 11
                    m._expectCalled(sayHello, "sayHello", invalid, invalid, [
                        "arg1"
                        "arg2"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);

                let codeText = getContents('code.brs');
                expect(codeText).to.equal(undent`
                    function sayHello(firstName = "" as string, lastName = "" as string)
                        __stubs_globalAa = getGlobalAa()
                        if RBS_SM_2_getMocksByFunctionName()["sayhello"] <> invalid
                            __stubOrMockResult = RBS_SM_2_getMocksByFunctionName()["sayhello"].callback(firstName, lastName)
                            return __stubOrMockResult
                        else if type(__stubs_globalAa?.__globalStubs?.sayhello).endsWith("Function")
                            __stubFunction = __stubs_globalAa.__globalStubs.sayhello
                            __stubOrMockResult = __stubFunction(firstName, lastName)
                            return __stubOrMockResult
                        else if __stubs_globalAa?.__globalStubs <> invalid and __stubs_globalAa.__globalStubs.doesExist("sayhello")
                            value = __stubs_globalAa.__globalStubs.sayhello
                            return value
                        end if
                        print firstName + " " + lastName
                    end function

                    function RBS_SM_2_getMocksByFunctionName()
                        if m._rMocksByFunctionName = invalid
                            m._rMocksByFunctionName = {}
                        end if
                        return m._rMocksByFunctionName
                    end function
                `);
            });
            it('correctly transpiles namespaced function calls', async () => {
                plugin.config.isGlobalMethodMockingEnabled = true;
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            item = {id: "item"}
                            m.expectCalled(utils.sayHello("arg1", "arg2"), "return")
                            m.expectCalled(utils.sayHello())
                            m.expectCalled(utils.sayHello(), "return")
                            m.expectCalled(utils.sayHello("arg1", "arg2"))
                        end function
                    end class
                `);
                program.setFile('source/code.bs', `
                    namespace utils
                        function sayHello(firstName = "" as string, lastName = "" as string)
                            print firstName + " " + lastName
                        end function
                    end namespace
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const testText = getTestFunctionContents();
                expect(
                    testText
                ).to.eql(undent`
                    item = {
                        id: "item"
                    }
                    m.currentAssertLineNumber = 8
                    m._expectCalled(utils_sayhello, "utils_sayhello", invalid, invalid, [
                        "arg1"
                        "arg2"
                    ], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectCalled(utils_sayhello, "utils_sayhello", invalid, invalid, [])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 10
                    m._expectCalled(utils_sayhello, "utils_sayhello", invalid, invalid, [], "return")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 11
                    m._expectCalled(utils_sayhello, "utils_sayhello", invalid, invalid, [
                        "arg1"
                        "arg2"
                    ])
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);

                let codeText = getContents('code.brs');
                expect(codeText).to.equal(undent(`
                    function utils_sayHello(firstName = "" as string, lastName = "" as string)
                        __stubs_globalAa = getGlobalAa()
                        if RBS_SM_2_getMocksByFunctionName()["utils_sayhello"] <> invalid
                            __stubOrMockResult = RBS_SM_2_getMocksByFunctionName()["utils_sayhello"].callback(firstName, lastName)
                            return __stubOrMockResult
                        else if type(__stubs_globalAa?.__globalStubs?.utils_sayhello).endsWith("Function")
                            __stubFunction = __stubs_globalAa.__globalStubs.utils_sayhello
                            __stubOrMockResult = __stubFunction(firstName, lastName)
                            return __stubOrMockResult
                        else if __stubs_globalAa?.__globalStubs <> invalid and __stubs_globalAa.__globalStubs.doesExist("utils_sayhello")
                            value = __stubs_globalAa.__globalStubs.utils_sayhello
                            return value
                        end if
                        print firstName + " " + lastName
                    end function

                    function RBS_SM_2_getMocksByFunctionName()
                        if m._rMocksByFunctionName = invalid
                            m._rMocksByFunctionName = {}
                        end if
                        return m._rMocksByFunctionName
                    end function
                `));
            });
        });

        describe('stubCall transpilation', () => {
            it('correctly transpiles call funcs', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.stubCall(m.thing@.getFunction())
                            m.stubCall(m.thing@.getFunction(), "return")
                            m.stubCall(m.thing@.getFunction("a", "b"))
                            m.stubCall(m.thing@.getFunction("a", "b"), "return")
                        end function
                        thing as roSGNode
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m._stubCall(m.thing, "callFunc", m, "m.thing")
                    m._stubCall(m.thing, "callFunc", m, "m.thing", "return")
                    m._stubCall(m.thing, "callFunc", m, "m.thing")
                    m._stubCall(m.thing, "callFunc", m, "m.thing", "return")
                `);
            });

            it('correctly transpiles func pointers', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.stubCall(m.thing.getFunctionField)
                            m.stubCall(m.thing.getFunctionField, "return")
                        end function
                        thing as Klass
                    end class

                    class Klass
                        function getFunctionField()
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m._stubCall(m.thing, "getFunctionField", m, "m.thing")
                    m._stubCall(m.thing, "getFunctionField", m, "m.thing", "return")
                `);
            });

            it('correctly transpiles func pointers - simple', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            item = {id:"item"}
                            m.stubCall(item.getFunctionField)
                            m.stubCall(item.getFunctionField, "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    item = {
                        id: "item"
                    }
                    m._stubCall(item, "getFunctionField", item, "item")
                    m._stubCall(item, "getFunctionField", item, "item", "return")
                `);
            });

            it('correctly transpiles function invocations', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.stubCall(m.thing.getFunction())
                            m.stubCall(m.thing.getFunction(), "return")
                            m.stubCall(m.thing.getFunction("arg1", "arg2"))
                            m.stubCall(m.thing.getFunction("arg1", "arg2"), "return")
                        end function
                        thing as Klass
                    end class
                    class Klass
                        function getFunction(arg1 = invalid, arg2 = invalid)
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m._stubCall(m.thing, "getFunction", m, "m.thing")
                    m._stubCall(m.thing, "getFunction", m, "m.thing", "return")
                    m._stubCall(m.thing, "getFunction", m, "m.thing")
                    m._stubCall(m.thing, "getFunction", m, "m.thing", "return")
                `);
            });

            it('correctly transpiles function invocations - simple object', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            item = {id: "item"}
                            m.stubCall(item.getFunction())
                            m.stubCall(item.getFunction(), "return")
                            m.stubCall(item.getFunction("arg1", "arg2"))
                            m.stubCall(item.getFunction("arg1", "arg2"), "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    item = {
                        id: "item"
                    }
                    m._stubCall(item, "getFunction", item, "item")
                    m._stubCall(item, "getFunction", item, "item", "return")
                    m._stubCall(item, "getFunction", item, "item")
                    m._stubCall(item, "getFunction", item, "item", "return")
                `);
            });

            it('correctly transpiles global function and inline anon function param', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("stubs global with inline anon with return value")
                        function _()
                          getGlobalAA().wasCalled = false
                          m.stubCall(globalFunctionWithReturn, function()
                            m.wasCalled = true
                            return true
                          end function)

                          m.assertTrue(globalFunctionWithReturn())
                          m.assertTrue(getGlobalAA().wasCalled)
                          m.assertRunningTestIsPassed() ' bs:disable-line: cannot-find-function
                        end function
                        wasCalled = false
                    end class

                    function globalFunctionWithReturn() as dynamic
                        m.wasCalled = false
                        return false
                    end function
                `);
                program.validate();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const result = getTestFunctionContents();
                expect(
                    result
                ).to.eql(undent`
                    getGlobalAA().wasCalled = false
                    m.stubCall(globalFunctionWithReturn, function()
                        m.wasCalled = true
                        return true
                    end function)
                    m.currentAssertLineNumber = 13
                    m.assertTrue(globalFunctionWithReturn())
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 14
                    m.assertTrue(getGlobalAA().wasCalled)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 15
                    m.assertRunningTestIsPassed()
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if ' bs:disable-line: cannot-find-function
                `);
            });

            it('correctly transpiles namespace function and inline anon function param', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("stubs global with inline anon with return value")
                        function _()
                          getGlobalAA().wasCalled = false
                          m.stubCall(testNamespace.functionWithReturn, function()
                            m.wasCalled = true
                            return true
                          end function)

                          m.assertTrue(testNamespace.functionWithReturn())
                          m.assertTrue(getGlobalAA().wasCalled)
                          m.assertRunningTestIsPassed() ' bs:disable-line: cannot-find-function
                        end function
                        wasCalled = false
                    end class

                    namespace testNamespace
                        function functionWithReturn() as dynamic
                            m.wasCalled = false
                            return false
                        end function
                    end namespace
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const result = getTestFunctionContents();
                expect(
                    result
                ).to.eql(undent`
                    getGlobalAA().wasCalled = false
                    m.stubCall(testNamespace_functionWithReturn, function()
                        m.wasCalled = true
                        return true
                    end function)
                    m.currentAssertLineNumber = 13
                    m.assertTrue(testNamespace_functionWithReturn())
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 14
                    m.assertTrue(getGlobalAA().wasCalled)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 15
                    m.assertRunningTestIsPassed()
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if ' bs:disable-line: cannot-find-function
                `);
            });

            it('correctly transpiles namespace function and variable anon function param', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("stubs global with anon from variable with return value")
                        function _()
                          getGlobalAA().wasCalled = false
                          stub = function()
                            m.wasCalled = true
                            return true
                          end function
                          m.stubCall(testNamespace.functionWithReturn, stub)

                          m.assertTrue(testNamespace.functionWithReturn())
                          m.assertTrue(getGlobalAA().wasCalled)
                          m.assertRunningTestIsPassed() ' bs:disable-line: cannot-find-function
                        end function
                        wasCalled = false
                    end class

                    namespace testNamespace
                        function functionWithReturn() as dynamic
                            m.wasCalled = false
                            return false
                        end function
                    end namespace
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const result = getTestFunctionContents();
                expect(
                    result
                ).to.eql(undent`
                    getGlobalAA().wasCalled = false
                    stub = function()
                        m.wasCalled = true
                        return true
                    end function
                    m.stubCall(testNamespace_functionWithReturn, stub)
                    m.currentAssertLineNumber = 14
                    m.assertTrue(testNamespace_functionWithReturn())
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 15
                    m.assertTrue(getGlobalAA().wasCalled)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 16
                    m.assertRunningTestIsPassed()
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if ' bs:disable-line: cannot-find-function
                `);
            });

            it('correctly transpiles namespace function by brightscript name and inline anon function param', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("stubs global with inline anon with return value")
                        function _()
                          getGlobalAA().wasCalled = false
                          m.stubCall(testNamespace_functionWithReturn, function()
                            m.wasCalled = true
                            return true
                          end function)

                          m.assertTrue(testNamespace_functionWithReturn())
                          m.assertTrue(getGlobalAA().wasCalled)
                          m.assertRunningTestIsPassed() ' bs:disable-line: cannot-find-function
                        end function
                        wasCalled = false
                    end class

                    namespace testNamespace
                        function functionWithReturn() as dynamic
                            m.wasCalled = false
                            return false
                        end function
                    end namespace
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const result = getTestFunctionContents();
                expect(
                    result
                ).to.eql(undent`
                    getGlobalAA().wasCalled = false
                    m.stubCall(testNamespace_functionWithReturn, function()
                        m.wasCalled = true
                        return true
                    end function)
                    m.currentAssertLineNumber = 13
                    m.assertTrue(testNamespace_functionWithReturn())
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 14
                    m.assertTrue(getGlobalAA().wasCalled)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 15
                    m.assertRunningTestIsPassed()
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if ' bs:disable-line: cannot-find-function
                `);
            });

            it('correctly transpiles namespace function by brightscript name and variable anon function param', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("stubs global with anon from variable with return value")
                        function _()
                          getGlobalAA().wasCalled = false
                          stub = function()
                            (m as object).wasCalled = true
                            return true
                          end function
                          m.stubCall(testNamespace_functionWithReturn, stub)

                          m.assertTrue(testNamespace_functionWithReturn())
                          m.assertTrue(getGlobalAA().wasCalled)
                          m.assertRunningTestIsPassed() ' bs:disable-line: cannot-find-function
                        end function
                    end class

                    namespace testNamespace
                        function functionWithReturn() as dynamic
                            m.wasCalled = false
                            return false
                        end function
                    end namespace
                `);
                program.validate();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const result = getTestFunctionContents();
                expect(
                    result
                ).to.eql(undent`
                    getGlobalAA().wasCalled = false
                    stub = function()
                        m.wasCalled = true
                        return true
                    end function
                    m.stubCall(testNamespace_functionWithReturn, stub)
                    m.currentAssertLineNumber = 14
                    m.assertTrue(testNamespace_functionWithReturn())
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 15
                    m.assertTrue(getGlobalAA().wasCalled)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 16
                    m.assertRunningTestIsPassed()
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if ' bs:disable-line: cannot-find-function
                `);
            });
        });

        describe('currentAssertLineNumber transpilation', () => {
            it('correctly transpiles currentAssertLineNumber with out duplications', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
                        @describe("tests AssertArrayContainsOnlyValuesOfType")
                        '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

                        @it("pass")
                        @params(["one", "two", "three"], "String")
                        @params([1, 2, 3], "Integer")
                        @params([true, true, false], "Boolean")
                        @params([[true, true], [false, false]], "Array")
                        @params([{ "test": 1 }, { "test": 1 }], "AssociativeArray")
                        function _(values, typeName)

                            m.assertArrayContainsOnlyValuesOfType(values, typeName)
                            isFail = m.currentResult.isFail

                            m.currentResult.Reset()

                            m.assertFalse(isFail)

                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 16
                    m.assertArrayContainsOnlyValuesOfType(values, typeName)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    isFail = m.currentResult.isFail
                    m.currentResult.Reset()
                    m.currentAssertLineNumber = 21
                    m.assertFalse(isFail)
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });
        });

        describe('expectNotCalled transpilation', () => {
            it('correctly transpiles call funcs', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectNotCalled(m.thing@.getFunction())
                            m.expectNotCalled(m.thing@.getFunction())
                        end function
                        thing as roSgNode
                    end class
                `);
                program.validate();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectNotCalled(m.thing, "callFunc", m, "m.thing")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(m.thing, "callFunc", m, "m.thing")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });

            it('correctly transpiles callfuncs on simple objects', async () => {
                const file = program.setFile<BrsFile>('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            thing = {} as roSGNode
                            m.expectNotCalled(thing@.getFunction())
                            m.expectNotCalled(thing@.getFunction("arg1", "arg2"))
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    thing = {}
                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(thing, "callFunc", thing, "thing")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectNotCalled(thing, "callFunc", thing, "thing")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
                //verify original code does not remain modified after the transpile cycle
                const testMethod = ((file.ast.statements[0] as ClassStatement).memberMap['_'] as MethodStatement);

                const call1 = (testMethod.func.body.statements[1] as ExpressionStatement).expression as CallExpression;
                expect(call1.args).to.be.lengthOf(1);
                expect(call1.args[0]).to.be.instanceof(CallfuncExpression);
                expect((call1.args[0] as CallfuncExpression).tokens.methodName.text).to.eql('getFunction');

                const call2 = (testMethod.func.body.statements[2] as ExpressionStatement).expression as CallExpression;
                expect(call2.args).to.be.lengthOf(1);
                expect(call2.args[0]).to.be.instanceof(CallfuncExpression);
                expect((call2.args[0] as CallfuncExpression).tokens.methodName.text).to.eql('getFunction');

            });

            it('correctly transpiles func pointers', async () => {
                const file = program.setFile<BrsFile>('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectNotCalled(m.thing.getFunctionField)
                        end function
                        thing = {}
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectNotCalled(m.thing, "getFunctionField", m, "m.thing")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
                //verify original code does not remain modified after the transpile cycle
                const testMethod = ((file.ast.statements[0] as ClassStatement).memberMap['_'] as MethodStatement);
                const call = (testMethod.func.body.statements[0] as ExpressionStatement).expression as CallExpression;
                const arg0 = call.args[0] as DottedGetExpression;
                expect(call.args).to.be.lengthOf(1);
                expect(arg0).to.be.instanceof(DottedGetExpression);
                expect(arg0.tokens.name.text).to.eql('getFunctionField');
            });

            it('correctly transpiles function invocations', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectNotCalled(m.thing.getFunction())
                            m.expectNotCalled(m.thing.getFunction())
                        end function
                        thing = {}
                    end class
                `);
                program.validate();
                const diagnostics = program.getDiagnostics();
                expect(diagnostics).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 7
                    m._expectNotCalled(m.thing, "getFunction", m, "m.thing")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(m.thing, "getFunction", m, "m.thing")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });

            it('correctly transpiles function invocations - simple object', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest extends Rooibos.BaseTestSuite
                        @describe("groupA")
                        @it("test1")
                        function _()
                        item = {id: "item"}
                        m.expectNotCalled(item.getFunction())
                        m.expectNotCalled(item.getFunction())
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.build();
                const testContents = getTestFunctionContents();
                expect(
                    testContents
                ).to.eql(undent`
                    item = {
                        id: "item"
                    }
                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(item, "getFunction", item, "item")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                    m.currentAssertLineNumber = 9
                    m._expectNotCalled(item, "getFunction", item, "item")
                    if m.currentResult?.isFail = true then
                        m.done()
                        return invalid
                    end if
                `);
            });
        });

        describe('honours tags - simple tests', () => {
            let testSource = `
                @tags("one", "two", "exclude")
                @suite("a")
                class ATest extends rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("is test1")
                    function t1()
                    end function
                end class
                @tags("one", "three")
                @suite("b")
                class BTest extends rooibos.BaseTestSuite
                    @describe("groupB")
                    @it("is test2")
                    function t2()
                    end function
                end class
            `;

            beforeEach(() => {
                setupProgram({
                    rootDir: _rootDir,
                    stagingDir: _stagingFolderPath,
                    //workaround for bsc bug where outDir does not fall back to stagingDir
                    outDir: _stagingFolderPath
                });
            });

            afterEach(() => {
                destroyProgram();
            });

            it('tag one', async () => {
                plugin.session.sessionInfo.includeTags = ['one'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.build();
                expect(builder.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('a');
                expect(plugin.session.sessionInfo.testSuitesToRun[1].name).to.equal('b');
            });

            it('tag two', async () => {
                plugin.session.sessionInfo.includeTags = ['two'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.build();
                expect(builder.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('a');
            });

            it('tag three', async () => {
                plugin.session.sessionInfo.includeTags = ['three'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.build();
                expect(builder.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('b');
            });

            it('tag exclude', async () => {
                plugin.session.sessionInfo.excludeTags = ['exclude'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.build();
                expect(builder.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('b');
            });

            it('include and exclude tags', async () => {
                plugin.session.sessionInfo.includeTags = ['one', 'two'];
                plugin.session.sessionInfo.excludeTags = ['exclude'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.build();
                expect(builder.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
            });

            it('Need all tags', async () => {
                plugin.session.sessionInfo.includeTags = ['one', 'two'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.build();
                expect(builder.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('a');
            });
        });
    });

    describe('does not prevent component scope validation of node tests', () => {
        it('does not prevent valid scope based diagnostics for node tests', () => {
            program.setFile('components/customComponent.xml', `
                <component name="CustomComponent" extends="Group" />
            `);
            program.setFile('components/customComponent.bs', ``);
            program.setFile('source/baseTestClass.spec.bs', `
                class BaseTestClass extends rooibos.BaseTestSuite
                    public function customHelperFunction() as boolean
                        return true
                    end function
                end class
            `);
            program.setFile('components/test2.spec.bs', `
                @suite
                @SGNode("CustomComponent")
                class ATest2 extends BaseTestClass
                    @describe("groupA")
                    @it("test1")
                    function _()
                        item = {id: "item"}
                        m.expectNotCalled(item.getFunction())
                    end function
                end class
            `);
            program.validate();
            let files = [...Object.values(program.files)].map(x => ({ src: x.srcPath, dest: x.pkgPath }));
            const diagnostics = program.getDiagnostics();
            expect(diagnostics.map(x => x.message)).to.include(`Cannot find name 'BaseTestClass'`);
        });
    });

    describe('addTestRunnerMetadata', () => {
        it('does not permanently modify the AST', async () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest1 extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("test1")
                    function _()
                        item = {id: "item"}
                        m.expectNotCalled(item.getFunction())
                        m.expectNotCalled(item.getFunction())
                    end function
                end class
            `);
            program.setFile('source/test2.spec.bs', `
                @suite
                class ATest2 extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("test1")
                    function _()
                        item = {id: "item"}
                        m.expectNotCalled(item.getFunction())
                        m.expectNotCalled(item.getFunction())
                    end function
                end class
            `);
            program.validate();
            const diagnostics = program.getDiagnostics();
            expect(diagnostics).to.be.empty;

            function findMethod(methodName: string) {
                const file = program.getFile<BrsFile>('source/rooibos/RuntimeConfig.bs');
                let classStatement = getFileLookups(file).classStatementMap.get('rooibos.runtimeconfig');
                const method = classStatement.methods.find(x => x.tokens.name.text.toLowerCase() === methodName.toLowerCase());
                return method;
            }

            //the methods should be empty by default
            expect(findMethod('getVersionText').func.body.statements).to.be.lengthOf(1);
            expect(findMethod('getRuntimeConfig').func.body.statements).to.be.lengthOf(1);
            expect(findMethod('getTestSuiteClassMap').func.body.statements).to.be.lengthOf(1);
            expect(findMethod('getIgnoredTestInfo').func.body.statements).to.be.lengthOf(1);

            await builder.build();

            expect(
                getTestFunctionContents()
            ).to.eql(undent`
                item = {
                    id: "item"
                }
                m.currentAssertLineNumber = 8
                m._expectNotCalled(item, "getFunction", item, "item")
                if m.currentResult?.isFail = true then
                    m.done()
                    return invalid
                end if
                m.currentAssertLineNumber = 9
                m._expectNotCalled(item, "getFunction", item, "item")
                if m.currentResult?.isFail = true then
                    m.done()
                    return invalid
                end if
            `);

            expect(
                getContents('rooibos/RuntimeConfig.brs')
            ).to.eql(undent`
                'import "pkg:/source/rooibos/JUnitTestReporter.bs"
                'import "pkg:/source/rooibos/ConsoleTestReporter.bs"
                'import "pkg:/source/rooibos/MochaTestReporter.bs"
                function __rooibos_RuntimeConfig_builder()
                    instance = {}
                    instance.new = function()
                        m.testSuites = {}
                        m.testSuites = m.getTestSuiteClassMap()
                    end function
                    instance.getVersionText = function() as string
                        return "${version}"
                    end function
                    instance.getRuntimeConfig = function() as dynamic
                        return {
                            "reporters": [
                                rooibos_ConsoleTestReporter
                            ]
                            "failFast": true
                            "sendHomeOnFinish": true
                            "logLevel": 0
                            "showOnlyFailures": true
                            "printTestTimes": true
                            "lineWidth": 60
                            "printLcov": false
                            "port": "invalid"
                            "catchCrashes": true
                            "colorizeOutput": false
                            "throwOnFailedAssertion": false
                            "keepAppOpen": true
                            "isRecordingCodeCoverage": false
                        }
                    end function
                    instance.getTestSuiteClassMap = function() as dynamic
                        return {
                            "ATest1": ATest1
                            "ATest2": ATest2
                        }
                    end function
                    instance.getTestSuiteClassWithName = function(name as string) as function
                        return m.testSuites[name]
                    end function
                    instance.getAllTestSuitesNames = function() as object
                        return m.testSuites.keys()
                    end function
                    instance.getIgnoredTestInfo = function() as dynamic
                        return {
                            "count": 0
                            "items": []
                        }
                    end function
                    return instance
                end function
                ' @ignore
                function rooibos_RuntimeConfig()
                    instance = __rooibos_RuntimeConfig_builder()
                    instance.new()
                    return instance
                end function
            `);

            //the methods should be empty again after transpile has finished
            expect(findMethod('getVersionText').func.body.statements).to.be.lengthOf(1);
            expect(findMethod('getRuntimeConfig').func.body.statements).to.be.lengthOf(1);
            expect(findMethod('getTestSuiteClassMap').func.body.statements).to.be.lengthOf(1);
            expect(findMethod('getIgnoredTestInfo').func.body.statements).to.be.lengthOf(1);
        });


        describe('test reporters', function runTests() {
            this.timeout(10_000);
            const sep = '\n';
            const params: [string[], string][] = [
                [[], 'rooibos_ConsoleTestReporter'],
                [['CONSOLE'], 'rooibos_ConsoleTestReporter'],
                [['MyCustomReporter'], 'MyCustomReporter'],
                [['mocha'], 'rooibos_MochaTestReporter'],
                [['JUnit', 'MyCustomReporter'], `rooibos_JUnitTestReporter${sep}MyCustomReporter`]
            ];

            async function runReporterTest(reporters: string[], expected: string[]) {
                setupProgram({
                    rootDir: _rootDir,
                    stagingDir: _stagingFolderPath,
                    //workaround for bsc bug where outDir does not fall back to stagingDir
                    outDir: _stagingFolderPath,
                    rooibos: {
                        reporters: reporters
                    }
                });
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;

                await builder.build();
                const content = getContents('rooibos/RuntimeConfig.brs');
                const noLeadingWhitespace = content.replace(/^\s+/gm, '');
                const actualLines = noLeadingWhitespace.split(sep);
                const start = actualLines.slice(actualLines.indexOf('"reporters": [') + 1);
                const actualReporters = start.slice(0, start.indexOf(']'));
                const expectedReporters = expected.join(`\n${' '.repeat(32)}`); // each is its own line, indented

                let fullExpected = undent`
                    'import "pkg:/source/rooibos/JUnitTestReporter.bs"
                    'import "pkg:/source/rooibos/ConsoleTestReporter.bs"
                    'import "pkg:/source/rooibos/MochaTestReporter.bs"
                    function __rooibos_RuntimeConfig_method_new()
                        m.testSuites = {}
                        m.testSuites = m.getTestSuiteClassMap()
                    end function
                    function __rooibos_RuntimeConfig_method_getVersionText() as string
                        return "${version}"
                    end function
                    function __rooibos_RuntimeConfig_method_getRuntimeConfig() as dynamic
                        return {
                            "reporters": [
                                ${expectedReporters}
                            ]
                            "failFast": true
                            "sendHomeOnFinish": true
                            "logLevel": 0
                            "showOnlyFailures": true
                            "printTestTimes": true
                            "lineWidth": 60
                            "printLcov": false
                            "port": "invalid"
                            "catchCrashes": true
                            "colorizeOutput": false
                            "throwOnFailedAssertion": false
                            "keepAppOpen": true
                            "isRecordingCodeCoverage": false
                        }
                    end function
                    function __rooibos_RuntimeConfig_method_getTestSuiteClassMap() as dynamic
                        return {}
                    end function
                    function __rooibos_RuntimeConfig_method_getTestSuiteClassWithName(name as string) as function
                        return m.testSuites[name]
                    end function
                    function __rooibos_RuntimeConfig_method_getAllTestSuitesNames() as object
                        return m.testSuites.keys()
                    end function
                    function __rooibos_RuntimeConfig_method_getIgnoredTestInfo() as dynamic
                        return {
                            "count": 0
                            "items": []
                        }
                    end function
                    function __rooibos_RuntimeConfig_builder()
                        instance = {}
                        instance.new = __rooibos_RuntimeConfig_method_new
                        instance.getVersionText = __rooibos_RuntimeConfig_method_getVersionText
                        instance.getRuntimeConfig = __rooibos_RuntimeConfig_method_getRuntimeConfig
                        instance.getTestSuiteClassMap = __rooibos_RuntimeConfig_method_getTestSuiteClassMap
                        instance.getTestSuiteClassWithName = __rooibos_RuntimeConfig_method_getTestSuiteClassWithName
                        instance.getAllTestSuitesNames = __rooibos_RuntimeConfig_method_getAllTestSuitesNames
                        instance.getIgnoredTestInfo = __rooibos_RuntimeConfig_method_getIgnoredTestInfo
                        return instance
                    end function
                    ' @ignore
                    function rooibos_RuntimeConfig()
                        instance = __rooibos_RuntimeConfig_builder()
                        instance.new()
                        return instance
                    end function
                `;

                expect(content).to.eql(fullExpected);

                expect(actualReporters).to.include.members(expected);
                destroyProgram();
            }

            it('adds console reporter by default', async () => {
                await runReporterTest([], ['rooibos_ConsoleTestReporter']);
            });

            it('recognizes console reporter, case insensitive', async () => {
                await runReporterTest(['CONSOLE'], ['rooibos_ConsoleTestReporter']);
            });

            it('can add a custom reporter', async () => {
                await runReporterTest(['MyCustomReporter'], ['MyCustomReporter']);
            });

            it('can add a multiple reporters, including Junit', async () => {
                await runReporterTest(['Junit', 'MyCustomReporter'], ['rooibos_JUnitTestReporter', 'MyCustomReporter']);
            });
        });
    });

    describe('node tests', () => {

        it('creates an async component using the @async annotation', async () => {
            program.options.autoImportComponentScript = true;
            program.setFile('components/customComponent.xml', `
                <component name="CustomComponent" extends="Group" />
            `);
            program.setFile('components/customComponent.bs', ``);
            program.setFile('source/baseTestClass.spec.bs', `
                class BaseTestClass extends rooibos.BaseTestSuite
                    public function customHelperFunction() as boolean
                        return true
                    end function
                end class
            `);
            program.setFile('source/test.spec.bs', `
                @suite
                @async(1000)
                @SGNode("CustomComponent")
                class ATest extends Rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("test1")
                    function _()
                        item = {id: "item"}
                        m.expectNotCalled(item.getFunction())
                    end function
                end class
            `);

            program.validate();
            const diagnostics = program.getDiagnostics();
            expect(diagnostics).to.be.empty;

            await builder.build();

            let sceneContent = getComponentContents('rooibos/RooibosScene.xml');
            expect(sceneContent).to.not.be.empty;
            let xmlContent = getComponentContents('rooibos/generated/ATest.xml');
            expect(xmlContent).to.not.be.empty;
            let brsContent = getComponentContents('rooibos/generated/ATest.brs');
            expect(brsContent).to.not.be.empty;

            destroyProgram();
        });
    });

    describe.skip('run a local project', () => {

        // TODO: This project should include its own app to run tests on
        // Perhaps using https://github.com/lvcabral/brs-engine to run non-node tests
        it('sanity checks on parsing - only run this outside of ci', () => {
            let programBuilder = new ProgramBuilder();
            let swv = {
                'stagingFolderPath': 'build',
                'rootDir': '/home/george/hope/open-source/rooibos/tests',
                'files': ['manifest', 'source/**/*.*', 'components/**/*.*'],
                'autoImportComponentScript': true,
                'createPackage': false,
                'diagnosticFilters': [
                    {
                        'src': '**/roku_modules/**/*.*',
                        'codes': [1107, 1009]
                    }
                ],
                'rooibos': {
                    'showOnlyFailures': true,
                    'catchCrashes': true,
                    'colorizeOutput': false,
                    'throwOnFailedAssertion': false,
                    'lineWidth': 70,
                    'failFast': false,
                    'sendHomeOnFinish': false,
                    'keepAppOpen': true
                },
                'maestro': {
                    'nodeFileDelay': 0,
                    'excludeFilters': [
                        '**/roku_modules/**/*',
                        '**/*BaseTestSuite*.bs'
                    ]
                },
                'sourceMap': true,
                'extends': 'bsconfig.json',
                'plugins': [
                    '/home/george/hope/open-source/maestro/maestro-roku-bsc-plugin/dist/plugin.js',
                    '/home/george/hope/open-source/rooibos/bsc-plugin/dist/plugin.js'
                ],
                'exclude': {
                    'id': '/home/george/hope/open-source/maestro/roku-log-bsc-plugin/dist/plugin.js'
                },
                'rokuLog': {
                    'strip': false,
                    'insertPkgPath': true
                }
            };

            programBuilder.run(
                // swv
                {
                    project: '/home/george/hope/open-source/rooibos/tests/bsconfig.json'
                    // project: '/home/george/hope/open-source/maestro/swerve-app/bsconfig-test.json'
                }
            ).catch(e => {
                console.error(e);
            });
            console.log('done');
        });
    });


    /**
     * Test that the sourcemaps are generated properly and map each token back to their original location.
     *
     * Keep in mind, the expectedText is trimmed, so as you're calculating the dest positions, brighterscript will probably omit the leading newline when transpiled,
     * so your dest lines might need to be 1 line smaller. Also, brighterscript does not honor source indentation, so your column numbers are probably going to be
     * based on the standard brighterscript formatting.
     * @param text the text to parse
     * @param expectedText the expected output text
     * @param expectedLocations an array of zero-based line and column arrays
     */
    async function testSourcemapLocations(text: string, expectedText: string, expectedLocations: Array<{ src: [number, number]; dest: [number, number] }>) {
        program.options.sourceMap = true;
        builder.options.sourceMap = true;
        fsExtra.outputFileSync(`${_rootDir}/source/test.spec.bs`, text);
        //set the file
        program.setFile('source/test.spec.bs', text);

        program.validate();
        //build the project
        await builder.build();

        const actualContents = getContents('test.spec.brs');
        expect(actualContents).to.eql(undent`${expectedText}`);

        const map = fsExtra.readFileSync(s`${_stagingFolderPath}/source/test.spec.brs.map`).toString();

        //load the source map
        await SourceMapConsumer.with(map, null, (consumer) => {
            expect(
                expectedLocations.map((x) => {
                    let originalPosition = consumer.originalPositionFor({
                        //convert 0-based line to source-map 1-based line for the lookup
                        line: x.dest[0] + 1,
                        column: x.dest[1],
                        bias: SourceMapConsumer.GREATEST_LOWER_BOUND
                    });
                    return Position.create(
                        //convert 1-based source-map line to 0-based for the test
                        originalPosition.line - 1,
                        originalPosition.column
                    );
                })
            ).to.eql(
                expectedLocations.map(
                    x => Position.create(x.src[0], x.src[1])
                )
            );
        });
    }
});

function getContents(filename: string) {
    return undent(
        fsExtra.readFileSync(s`${_stagingFolderPath}/source/${filename}`).toString()
    );
}

function getComponentContents(filename: string) {
    return undent(
        fsExtra.readFileSync(s`${_stagingFolderPath}/components/${filename}`).toString()
    );
}

function getTestFunctionContents() {
    const contents = getContents('test.spec.brs');

    //try to find inline function
    let [, result] = /instance.rooiboos_test_case_[\w_]+\s?\= function\((?:[\w,\s]*)\)\s?([\S\s]*|.*)(?=^\s*end function\s+instance\.)/img.exec(contents) ?? [];
    if (result) {
        return undent(result);
    }

    //try to find a hoisted version of the function
    let [, testName] = /instance.rooiboos_test_case_[\w_]+\s?\=\s?([\w_]+)/img.exec(contents) ?? [];
    if (testName) {
        //find the function contents by this name
        let [, result] = new RegExp(`(?:function|sub)\\s+${testName}\\((?:[\\w,\\s]*)\\)\\s?([\\S\\s]*|.*)(?=^\\s*end function)`, 'img').exec(contents) ?? [];
        if (result) {
            return undent(result);
        }
    }
    return undefined;
}

function getTestSubContents() {
    const contents = getContents('test.spec.brs');
    const [, body] = /rooiboos_test_case_[a-z0-9]+_\d+ \= sub\(\)([\S\s]*|.*)(?=end sub)/gim.exec(contents);
    let result = undent(
        body.split('end sub')[0]
    );
    return result;
}
