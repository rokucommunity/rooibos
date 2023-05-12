import type { BrsFile, CallExpression, ClassMethodStatement, ClassStatement, ExpressionStatement, FunctionStatement } from 'brighterscript';
import { CallfuncExpression, DiagnosticSeverity, DottedGetExpression, Program, ProgramBuilder, util, standardizePath as s, PrintStatement } from 'brighterscript';
import { expect } from 'chai';
import { RooibosPlugin } from './plugin';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as trim from 'trim-whitespace';
import undent from 'undent';
let tmpPath = s`${process.cwd()}/tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingFolderPath = s`${tmpPath}/staging`;
const version = fsExtra.readJsonSync(__dirname + '/../package.json').version;

describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;
    beforeEach(() => {
        plugin = new RooibosPlugin();
        options = {
            rootDir: _rootDir,
            stagingFolderPath: _stagingFolderPath,
            stagingDir: _stagingFolderPath
        };
        fsExtra.ensureDirSync(_stagingFolderPath);
        fsExtra.ensureDirSync(_rootDir);
        fsExtra.ensureDirSync(tmpPath);

        builder = new ProgramBuilder();
        builder.options = util.normalizeAndResolveConfig(options);
        builder.program = new Program(builder.options);
        program = builder.program;
        program.plugins.add(plugin);
        program.createSourceScope(); //ensure source scope is created
        plugin.beforeProgramCreate(builder);
        plugin.fileFactory['options'].frameworkSourcePath = path.resolve(path.join('../framework/src/source'));
        plugin.afterProgramCreate(program);
    });

    afterEach(() => {
        fsExtra.ensureDirSync(tmpPath);
        fsExtra.emptyDirSync(tmpPath);
        builder.dispose();
        program.dispose();
    });

    describe('basic tests', () => {
        it('does not find tests with no annotations', () => {
            program.setFile('source/test.spec.bs', `
                class notATest
                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
        });

        it('finds a basic suite', () => {
            program.setFile('source/test.spec.bs', `
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
            let test = suite.testGroups.get('groupA').testCases.get('is test1');
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
            let test = suite.testGroups.get('groupA').testCases.get('is test1');
            expect(test.isAsync).to.be.true;
            expect(test.asyncTimeout).to.equal(2);
        });

        it('ignores a suite', () => {
            program.setFile('source/test.spec.bs', `
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

        it('ignores a group', () => {
            program.setFile('source/test.spec.bs', `
            @suite
                    class ATest
                    @ignore
                    @describe("groupA")

                    @it("is test1")
                    function Test()
                    end function

                end class
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.groupsCount).to.equal(0);
            expect(plugin.session.sessionInfo.testsCount).to.equal(0);
        });

        it('ignores a test', () => {
            program.setFile('source/test.spec.bs', `
            @suite
            class ATest
            @describe("groupA")

            @ignore
            @it("is test1")
                    function Test()
                    end function

                    end class
                    `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(0);
        });

        it('multiple groups', () => {
            program.setFile('source/test.spec.bs', `
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
            program.setFile('source/test.spec.bs', `
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
            program.setFile('source/test.spec.bs', `
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
            program.setFile('source/test.spec.bs', `
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
            program.setFile('source/test.spec.bs', `
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

        it('updates test name to match name of annotation', () => {
            program.setFile('source/test.spec.bs', `
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

        it('updates test name to match name of annotation - with params', () => {
            program.setFile('source/test.spec.bs', `
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
            program.setFile('source/test.spec.bs', `
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
            const file = program.setFile<BrsFile>('source/test.spec.bs', `
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

            expect(
                getContents('rooibosMain.brs')
            ).to.eql(undent`
                function main()
                    Rooibos_init("TestsScene")
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
                    instance.groupA_is_test1 = function()
                    end function
                    instance.super0_getTestSuiteData = instance.getTestSuiteData
                    instance.getTestSuiteData = function()
                        return {
                            name: "ATest"
                            isSolo: false
                            noCatch: false
                            isIgnored: false
                            pkgPath: "${s`source/test.spec.bs`}"
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
                                    filename: "${s`source/test.spec.bs`}"
                                    lineNumber: "3"
                                    setupFunctionName: ""
                                    tearDownFunctionName: ""
                                    beforeEachFunctionName: ""
                                    afterEachFunctionName: ""
                                    testCases: [
                                        {
                                            isSolo: false
                                            noCatch: false
                                            funcName: "groupA_is_test1"
                                            isIgnored: false
                                            isAsync: false
                                            asyncTimeout: 2000
                                            isParamTest: false
                                            name: "is test1"
                                            lineNumber: 7
                                            paramLineNumber: 0
                                            assertIndex: 0
                                            assertLineNumberMap: {}
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
            expect(cls.body.find((x: ClassMethodStatement) => {
                return x.name?.text.toLowerCase() === 'getTestSuiteData'.toLowerCase();
            })).not.to.exist;
        });

        it('test full transpile with complex params', async () => {
            plugin.afterProgramCreate(program);
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
            await builder.transpile();
            console.log(builder.getDiagnostics());
            expect(builder.getDiagnostics()).to.have.length(1);
            expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
            expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
            expect(plugin.session.sessionInfo.suitesCount).to.equal(1);
            expect(plugin.session.sessionInfo.groupsCount).to.equal(1);
            expect(plugin.session.sessionInfo.testsCount).to.equal(1);

            expect(
                getContents('rooibosMain.brs')
            ).to.eql(undent`
                function main()
                    Rooibos_init("TestsScene")
                end function
            `);
        });

        it('adds launch hook to existing main function', async () => {
            options = {
                rootDir: _rootDir,
                stagingFolderPath: _stagingFolderPath,
                stagingDir: _stagingFolderPath,
                rooibos: {
                    testSceneName: 'CustomTestsScene'
                }
            };
            plugin = new RooibosPlugin();
            fsExtra.ensureDirSync(_stagingFolderPath);
            fsExtra.ensureDirSync(_rootDir);
            fsExtra.ensureDirSync(tmpPath);

            builder = new ProgramBuilder();
            builder.options = util.normalizeAndResolveConfig(options);
            builder.program = new Program(builder.options);
            program = builder.program;
            program.plugins.add(plugin);
            program.createSourceScope(); //ensure source scope is created
            plugin.beforeProgramCreate(builder);
            plugin.fileFactory['options'].frameworkSourcePath = path.resolve(path.join('../framework/src/source'));
            plugin.afterProgramCreate(program);
            // program.validate();
            const file = program.setFile<BrsFile>('source/main.bs', `
                sub main()
                    print "main"
                end sub
            `);
            program.validate();
            await builder.transpile();

            expect(
                getContents('main.brs')
            ).to.eql(undent`
                sub main()
                    Rooibos_init("CustomTestsScene")
                    print "main"
                end sub
            `);
            //the AST should not have been permanently modified
            const statements = (file.parser.statements[0] as FunctionStatement).func.body.statements;
            expect(statements).to.be.lengthOf(1);
            expect(statements[0]).to.be.instanceof(PrintStatement);
        });


        it('adds launch hook with custom scene', async () => {
            plugin.config.testSceneName = 'CustomSCene';
            plugin.afterProgramCreate(program);
            // program.validate();
            const file = program.setFile<BrsFile>('source/main.bs', `
                sub main()
                    print "main"
                end sub
            `);
            program.validate();
            await builder.transpile();

            expect(
                getContents('main.brs')
            ).to.eql(undent`
                sub main()
                    Rooibos_init("CustomSCene")
                    print "main"
                end sub
            `);
            //the AST should not have been permanently modified
            const statements = (file.parser.statements[0] as FunctionStatement).func.body.statements;
            expect(statements).to.be.lengthOf(1);
            expect(statements[0]).to.be.instanceof(PrintStatement);
        });

        describe('expectCalled transpilation', () => {
            it('correctly transpiles call funcs', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.expectCalled(m.thing@.getFunction())
                        m.expectCalled(m.thing@.getFunction(), "return")
                        m.expectCalled(m.thing@.getFunction("a", "b"))
                        m.expectCalled(m.thing@.getFunction("a", "b"), "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                expect(
                    getTestFunctionContents(true)
                ).to.eql(undent`
                    m.currentAssertLineNumber = 6
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                    "getFunction"
                    ])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                    "getFunction"
                    ], "return")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                    "getFunction"
                    "a"
                    "b"
                    ])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 9
                    m._expectCalled(m.thing, "callFunc", m, "m.thing", [
                    "getFunction"
                    "a"
                    "b"
                    ], "return")
                    if m.currentResult.isFail then return invalid
                `);
            });

            it('correctly transpiles func pointers', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.expectCalled(m.thing.getFunctionField)
                        m.expectCalled(m.thing.getFunctionField, "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 6
                    m._expectCalled(m.thing, "getFunctionField", m, "m.thing", invalid)
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "getFunctionField", m, "m.thing", invalid, "return")
                    if m.currentResult.isFail then return invalid
                `);
            });

            it('correctly transpiles function invocations', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.expectCalled(m.thing.getFunction())
                        m.expectCalled(m.thing.getFunction(), "return")
                        m.expectCalled(m.thing.getFunction("arg1", "arg2"))
                        m.expectCalled(m.thing.getFunction("arg1", "arg2"), "return")
                        end function
                    end class
                `);
                program.validate();
                await builder.transpile();
                expect(program.getDiagnostics().filter((d) => d.code !== 'RBS2213')).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(
                    getTestFunctionContents(true)
                ).to.eql(undent`
                    m.currentAssertLineNumber = 6
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [], "return")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                    "arg1"
                    "arg2"
                    ])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 9
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                    "arg1"
                    "arg2"
                    ], "return")
                    if m.currentResult.isFail then return invalid
                `);
            });
            it('does not break when validating again after a transpile', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.expectCalled(m.thing.getFunction())
                        m.expectCalled(m.thing.getFunction(), "return")
                        m.expectCalled(m.thing.getFunction("arg1", "arg2"))
                        m.expectCalled(m.thing.getFunction("arg1", "arg2"), "return")
                        end function
                    end class
                `);
                program.validate();
                await builder.transpile();
                program.validate();
                expect(program.getDiagnostics().filter((d) => d.code !== 'RBS2213')).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(
                    getTestFunctionContents(true)
                ).to.eql(undent`
                    m.currentAssertLineNumber = 6
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 7
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [], "return")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                    "arg1"
                    "arg2"
                    ])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 9
                    m._expectCalled(m.thing, "getFunction", m, "m.thing", [
                    "arg1"
                    "arg2"
                    ], "return")
                    if m.currentResult.isFail then return invalid
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
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                            b = { someValue: lib.myEnum.value}
                            m.assertEqual(b, { someValue: lib.myEnum.value})
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                // expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                expect(
                    getTestFunctionContents(true)
                ).to.eql(undent`
                    b = {
                    someValue: "value"
                    }

                    m.currentAssertLineNumber = 12
                    m.assertEqual(b, {
                    someValue: "value"
                    })
                    if m.currentResult.isFail then return invalid`);
            });

            it('correctly transpiles function invocations - simple object', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
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
                await builder.transpile();
                expect(
                    getTestFunctionContents(true)
                ).to.eql(undent`
                    item = {
                    id: "item"
                    }

                    m.currentAssertLineNumber = 7
                    m._expectCalled(item, "getFunction", item, "item", [])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectCalled(item, "getFunction", item, "item", [], "return")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 9
                    m._expectCalled(item, "getFunction", item, "item", [
                    "arg1"
                    "arg2"
                    ])
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 10
                    m._expectCalled(item, "getFunction", item, "item", [
                    "arg1"
                    "arg2"
                    ], "return")
                    if m.currentResult.isFail then return invalid
                `);
            });
        });

        describe('stubCall transpilation', () => {
            it('correctly transpiles call funcs', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.stubCall(m.thing@.getFunction())
                            m.stubCall(m.thing@.getFunction(), "return")
                            m.stubCall(m.thing@.getFunction("a", "b"))
                            m.stubCall(m.thing@.getFunction("a", "b"), "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
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
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.stubCall(m.thing.getFunctionField)
                        m.stubCall(m.thing.getFunctionField, "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
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
                    class ATest
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
                await builder.transpile();
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
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.stubCall(m.thing.getFunction())
                        m.stubCall(m.thing.getFunction(), "return")
                        m.stubCall(m.thing.getFunction("arg1", "arg2"))
                        m.stubCall(m.thing.getFunction("arg1", "arg2"), "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
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
                    class ATest
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
                await builder.transpile();
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
        });

        describe('expectNotCalled transpilation', () => {
            it('correctly transpiles call funcs', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.expectNotCalled(m.thing@.getFunction())
                        m.expectNotCalled(m.thing@.getFunction(), "return")
                        m.expectNotCalled(m.thing@.getFunction())
                        m.expectNotCalled(m.thing@.getFunction(), "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 6
                    m._expectNotCalled(m.thing, "callFunc", m, "m.thing")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 7
                    m._expectNotCalled(m.thing, "callFunc", m, "m.thing", "return")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(m.thing, "callFunc", m, "m.thing")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 9
                    m._expectNotCalled(m.thing, "callFunc", m, "m.thing", "return")
                    if m.currentResult.isFail then return invalid
                `);
            });

            it('correctly transpiles callfuncs on simple objects', async () => {
                const file = program.setFile<BrsFile>('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                            thing = {}
                            m.expectNotCalled(thing@.getFunction())
                            m.expectNotCalled(thing@.getFunction("arg1", "arg2"))
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    thing = {}

                    m.currentAssertLineNumber = 7
                    m._expectNotCalled(thing, "callFunc", thing, "thing")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(thing, "callFunc", thing, "thing")
                    if m.currentResult.isFail then return invalid
                `);
                //verify original code does not remain modified after the transpile cycle
                const testMethod = ((file.ast.statements[0] as ClassStatement).memberMap['_'] as ClassMethodStatement);

                const call1 = (testMethod.func.body.statements[1] as ExpressionStatement).expression as CallExpression;
                expect(call1.args).to.be.lengthOf(1);
                expect(call1.args[0]).to.be.instanceof(CallfuncExpression);
                expect((call1.args[0] as CallfuncExpression).methodName.text).to.eql('getFunction');

                const call2 = (testMethod.func.body.statements[2] as ExpressionStatement).expression as CallExpression;
                expect(call2.args).to.be.lengthOf(1);
                expect(call2.args[0]).to.be.instanceof(CallfuncExpression);
                expect((call2.args[0] as CallfuncExpression).methodName.text).to.eql('getFunction');

            });

            it('correctly transpiles func pointers', async () => {
                const file = program.setFile<BrsFile>('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                            m.expectNotCalled(m.thing.getFunctionField)
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 6
                    m._expectNotCalled(m.thing, "getFunctionField", m, "m.thing")
                    if m.currentResult.isFail then return invalid
                `);
                //verify original code does not remain modified after the transpile cycle
                const testMethod = ((file.ast.statements[0] as ClassStatement).memberMap['_'] as ClassMethodStatement);
                const call = (testMethod.func.body.statements[0] as ExpressionStatement).expression as CallExpression;
                const arg0 = call.args[0] as DottedGetExpression;
                expect(call.args).to.be.lengthOf(1);
                expect(arg0).to.be.instanceof(DottedGetExpression);
                expect(arg0.name.text).to.eql('getFunctionField');
            });

            it('correctly transpiles function invocations', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
                        @describe("groupA")
                        @it("test1")
                        function _()
                        m.expectNotCalled(m.thing.getFunction())
                        m.expectNotCalled(m.thing.getFunction(), "return")
                        m.expectNotCalled(m.thing.getFunction())
                        m.expectNotCalled(m.thing.getFunction(), "return")
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                await builder.transpile();
                expect(
                    getTestFunctionContents()
                ).to.eql(undent`
                    m.currentAssertLineNumber = 6
                    m._expectNotCalled(m.thing, "getFunction", m, "m.thing")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 7
                    m._expectNotCalled(m.thing, "getFunction", m, "m.thing", "return")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(m.thing, "getFunction", m, "m.thing")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 9
                    m._expectNotCalled(m.thing, "getFunction", m, "m.thing", "return")
                    if m.currentResult.isFail then return invalid
                `);
            });

            it('correctly transpiles function invocations - simple object', async () => {
                program.setFile('source/test.spec.bs', `
                    @suite
                    class ATest
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
                await builder.transpile();
                expect(
                    getTestFunctionContents(true)
                ).to.eql(undent`
                    item = {
                    id: "item"
                    }

                    m.currentAssertLineNumber = 7
                    m._expectNotCalled(item, "getFunction", item, "item")
                    if m.currentResult.isFail then return invalid


                    m.currentAssertLineNumber = 8
                    m._expectNotCalled(item, "getFunction", item, "item")
                    if m.currentResult.isFail then return invalid
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
                plugin = new RooibosPlugin();
                options = {
                    rootDir: _rootDir,
                    stagingFolderPath: _stagingFolderPath
                };
                fsExtra.ensureDirSync(_stagingFolderPath);
                fsExtra.ensureDirSync(_rootDir);
                fsExtra.ensureDirSync(tmpPath);

                builder = new ProgramBuilder();
                builder.options = util.normalizeAndResolveConfig(options);
                builder.program = new Program(builder.options);
                program = builder.program;
                builder.program = new Program(builder.options);
                program = builder.program;
                program.plugins.add(plugin);
                program.createSourceScope(); //ensure source scope is created
                plugin.beforeProgramCreate(builder);
                plugin.fileFactory['options'].frameworkSourcePath = path.resolve(path.join('../framework/src/source'));
                plugin.afterProgramCreate(program);
                // program.validate();
            });

            afterEach(() => {
                fsExtra.ensureDirSync(tmpPath);
                fsExtra.emptyDirSync(tmpPath);
                builder.dispose();
                program.dispose();
            });

            it('tag one', async () => {
                plugin.session.sessionInfo.includeTags = ['one'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.transpile();
                console.log(builder.getDiagnostics());
                expect(builder.getDiagnostics()).to.have.length(1);
                expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('a');
                expect(plugin.session.sessionInfo.testSuitesToRun[1].name).to.equal('b');
            });

            it('tag two', async () => {
                plugin.session.sessionInfo.includeTags = ['two'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.transpile();
                console.log(builder.getDiagnostics());
                expect(builder.getDiagnostics()).to.have.length(1);
                expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('a');
            });

            it('tag three', async () => {
                plugin.session.sessionInfo.includeTags = ['three'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.transpile();
                console.log(builder.getDiagnostics());
                expect(builder.getDiagnostics()).to.have.length(1);
                expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('b');
            });

            it('tag exclude', async () => {
                plugin.session.sessionInfo.excludeTags = ['exclude'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.transpile();
                console.log(builder.getDiagnostics());
                expect(builder.getDiagnostics()).to.have.length(1);
                expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('b');
            });

            it('include and exclude tags', async () => {
                plugin.session.sessionInfo.includeTags = ['one', 'two'];
                plugin.session.sessionInfo.excludeTags = ['exclude'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.transpile();
                console.log(builder.getDiagnostics());
                expect(builder.getDiagnostics()).to.have.length(1);
                expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
                expect(plugin.session.sessionInfo.testSuitesToRun).to.be.empty;
            });

            it('Need all tags', async () => {
                plugin.session.sessionInfo.includeTags = ['one', 'two'];
                program.setFile('source/test.spec.bs', testSource);
                program.validate();
                await builder.transpile();
                console.log(builder.getDiagnostics());
                expect(builder.getDiagnostics()).to.have.length(1);
                expect(builder.getDiagnostics()[0].severity).to.equal(DiagnosticSeverity.Warning);
                expect(plugin.session.sessionInfo.testSuitesToRun).to.not.be.empty;
                expect(plugin.session.sessionInfo.testSuitesToRun[0].name).to.equal('a');
            });
        });
    });

    describe('addTestRunnerMetadata', () => {
        it('does not permanently modify the AST', async () => {
            program.setFile('source/test.spec.bs', `
                @suite
                class ATest1
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
                class ATest2
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

            function findMethod(methodName: string) {
                const file = program.getFile<BrsFile>('source/rooibos/RuntimeConfig.bs');
                let classStatement = file.parser.references.classStatementLookup.get('rooibos.runtimeconfig');
                const method = classStatement.methods.find(x => x.name.text.toLowerCase() === methodName.toLowerCase());
                return method;
            }

            //the methods should be empty by default
            expect(findMethod('getVersionText').func.body.statements).to.be.empty;
            expect(findMethod('getRuntimeConfig').func.body.statements).to.be.empty;
            expect(findMethod('getTestSuiteClassWithName').func.body.statements).to.be.empty;
            expect(findMethod('getAllTestSuitesNames').func.body.statements).to.be.empty;
            expect(findMethod('getIgnoredTestInfo').func.body.statements).to.be.empty;

            await builder.transpile();
            let l = getTestFunctionContents(true);
            expect(
                getTestFunctionContents(true)
            ).to.eql(undent`
                item = {
                id: "item"
                }

                m.currentAssertLineNumber = 7
                m._expectNotCalled(item, "getFunction", item, "item")
                if m.currentResult.isFail then return invalid


                m.currentAssertLineNumber = 8
                m._expectNotCalled(item, "getFunction", item, "item")
                if m.currentResult.isFail then return invalid
            `);

            let a = getContents('rooibos/RuntimeConfig.brs');
            expect(
                getContents('rooibos/RuntimeConfig.brs')
            ).to.eql(undent`
                function __rooibos_RuntimeConfig_builder()
                    instance = {}
                    instance.new = sub()
                    end sub
                    instance.getVersionText = function()
                        return "${version}"
                    end function
                    instance.getRuntimeConfig = function()
                        return {
                            "failFast": false
                            "sendHomeOnFinish": false
                            "logLevel": 0
                            "showOnlyFailures": false
                            "printTestTimes": false
                            "lineWidth": 60
                            "printLcov": false
                            "port": "invalid"
                            "catchCrashes": false
                            "keepAppOpen": true
                        }
                    end function
                    instance.getTestSuiteClassWithName = function(name)
                        if false
                            ? "noop"
                        else if name = "ATest1"
                            return ATest1
                        else if name = "ATest2"
                            return ATest2
                        end if
                    end function
                    instance.getAllTestSuitesNames = function()
                        return [
                            "ATest1"
                            "ATest2"
                        ]
                    end function
                    instance.getIgnoredTestInfo = function()
                        return {
                            "count": 0
                            "items": [
                            ]
                        }
                    end function
                    return instance
                end function
                function rooibos_RuntimeConfig()
                    instance = __rooibos_RuntimeConfig_builder()
                    instance.new()
                    return instance
                end function
            `);

            //the methods should be empty again after transpile has finished
            expect(findMethod('getVersionText').func.body.statements).to.be.empty;
            expect(findMethod('getRuntimeConfig').func.body.statements).to.be.empty;
            expect(findMethod('getTestSuiteClassWithName').func.body.statements).to.be.empty;
            expect(findMethod('getAllTestSuitesNames').func.body.statements).to.be.empty;
            expect(findMethod('getIgnoredTestInfo').func.body.statements).to.be.empty;
        });
    });

    describe.skip('run a local project', () => {
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
});

function getContents(filename: string) {
    return undent(
        fsExtra.readFileSync(s`${_stagingFolderPath}/source/${filename}`).toString()
    );
}

function getTestFunctionContents(trimEveryLine = false) {
    const contents = getContents('test.spec.brs');
    const [, body] = /\= function\(\)([\S\s]*|.*)(?=end function)/gim.exec(contents);
    let result = undent(
        body.split('end function')[0]
    );
    if (trimEveryLine) {
        result = trim(result);
    }
    return result;
}
