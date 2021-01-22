/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { Program, ProgramBuilder, util } from 'brighterscript';
import { expect } from 'chai';
import * as fsExtra from 'fs-extra';
import { standardizePath as s } from './lib/rooibos/Utils';
import { RooibosPlugin } from './plugin';
import PluginInterface from 'brighterscript/dist/PluginInterface';

let tmpPath = s`${process.cwd()}/.tmp`;
let rootDir = s`${tmpPath}/rootDir`;
let stagingFolderPath = s`${tmpPath}/staging`;

describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;

    beforeEach(async () => {
        plugin = new RooibosPlugin();
        fsExtra.ensureDirSync(tmpPath);
        fsExtra.emptyDirSync(tmpPath);

        builder = new ProgramBuilder();
        builder.options = await util.normalizeAndResolveConfig({
            rootDir: rootDir
        });
        builder.program = new Program(builder.options);
        program = new Program({
            rootDir: rootDir,
            stagingFolderPath: stagingFolderPath
        });
        program.plugins = new PluginInterface([plugin], undefined);
        program.createSourceScope(); //ensure source scope is created
        plugin.beforeProgramCreate(builder);


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
            expect(suite.getTestGroups()[1].testCases).to.have.length(2);
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
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
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
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });
    });
});
