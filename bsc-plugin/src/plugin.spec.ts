/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { DiagnosticSeverity, Program, ProgramBuilder, util } from 'brighterscript';
import { expect } from 'chai';
import { standardizePath as s } from './lib/rooibos/Utils';
import { RooibosPlugin } from './plugin';
import PluginInterface from 'brighterscript/dist/PluginInterface';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
let tmpPath = s`${process.cwd()}/tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingFolderPath = s`${tmpPath}/staging`;

import { trimLeading } from './lib/utils/testHelpers.spec';

describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;
    beforeEach(async () => {
        plugin = new RooibosPlugin();
        options = {
            rootDir: _rootDir,
            stagingFolderPath: _stagingFolderPath
        };
        fsExtra.ensureDirSync(_stagingFolderPath);
        fsExtra.ensureDirSync(_rootDir);
        fsExtra.ensureDirSync(tmpPath);

        builder = new ProgramBuilder();
        builder.options = await util.normalizeAndResolveConfig(options);
        builder.program = new Program(builder.options);
        program = builder.program;
        builder.plugins = new PluginInterface([plugin], undefined);
        program.plugins = new PluginInterface([plugin], undefined);
        program.createSourceScope(); //ensure source scope is created
        plugin.beforeProgramCreate(builder);
        plugin.fileFactory.sourcePath = path.resolve(path.join('../framework/src/source'));


    });
    afterEach(() => {
        fsExtra.ensureDirSync(tmpPath);
        fsExtra.emptyDirSync(tmpPath);
        builder.dispose();
        program.dispose();
    });

    describe('basic tests', () => {

        it('does not find tests with no annotations', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                class notATest
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });
        it('finds a basic suite', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
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
        });
        it('finds a suite name, only', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
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
        it('ignores a suite', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                @ignore
                @suite
                class ATest
                    @describe("groupA")

                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });
        it('multiple groups', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
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
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
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
            expect(program.getDiagnostics()).to.not.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });
        it('empty test group', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
                    @describe("groupA")
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.not.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });
        it('multiple test group annotations - same name', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
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
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
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
        it.only('updates test name to match name of annotation', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
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
        it.only('updates test name to match name of annotation - with params', () => {
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
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
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest
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

        it('test full transpile', async () => {
            plugin.afterProgramCreate(program);
            // program.validate();
            program.addOrReplaceFile('source/test.spec.bs', `
                @suite
                class ATest extends rooibos.BaseTestSuite
                    @describe("groupA")
                    @it("is test1")
                    function Test_3()
                    end function
                end class
            `);
            program.validate();
            await builder.transpile();
            console.log(builder.getDiagnostics());
            expect(builder.getDiagnostics()).to.have.length(1);
            expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            expect(plugin.session.sessionInfo.suitesCount).to.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(1);

            expect(getContents('rooibosMain.brs')).to.eql(trimLeading(`function main()
    Rooibos_init()
end function`).trim());
            let a = getContents('test.spec.brs');
            let b = trimLeading(`function __ATest_builder()
            instance = __rooibos_BaseTestSuite_builder()
            instance.super0_new = instance.new
            instance.new = sub()
                m.super0_new()
            end sub
            instance.Test_3 = function()
            end function
            instance.super0_getTestSuiteData = instance.getTestSuiteData
            instance.getTestSuiteData = function()
                return {
                    name: "ATest",
                    isSolo: false,
                    isIgnored: false,
                    filePath: "source/test.spec.bs",
                    lineNumber: 2,
                    valid: true,
                    hasFailures: false,
                    hasSoloTests: false,
                    hasIgnoredTests: false,
                    hasSoloGroups: false,
                    setupFunctionName: "",
                    tearDownFunctionName: "",
                    beforeEachFunctionName: "",
                    afterEachFunctionName: "",
                    isNodeTest: false,
                    nodeName: "",
                    generatedNodeName: "ATest",
                    testGroups: [
                        {
                            name: "groupA",
                            isSolo: false,
                            isIgnored: false,
                            filename: "source/test.spec.bs",
                            setupFunctionName: "",
                            tearDownFunctionName: "",
                            beforeEachFunctionName: "",
                            afterEachFunctionName: "",
                            testCases: [
                                {
                                    isSolo: false,
                                    funcName: "Test_3",
                                    isIgnored: false,
                                    isParamTest: false,
                                    name: "is test1",
                                    lineNumber: 5,
                                    paramLineNumber: 0,
                                    assertIndex: 0,
                                    assertLineNumberMap: {},
                                    rawParams: [],
                                    paramTestIndex: 0,
                                    expectedNumberOfParams: 0,
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
        end function`);
            expect(a).to.eql(b);
        });

    });
});

function getContents(filename: string) {
    return trimLeading(fsExtra.readFileSync(s`${_stagingFolderPath}/source/${filename}`).toString());
}
