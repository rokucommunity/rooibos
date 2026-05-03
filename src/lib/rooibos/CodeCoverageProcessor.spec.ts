import { Program, ProgramBuilder, util, standardizePath as s } from 'brighterscript';
import { expect } from 'chai';
import PluginInterface from 'brighterscript/dist/PluginInterface';
import * as fsExtra from 'fs-extra';
import { RooibosPlugin } from '../../plugin';
import undent from 'undent';

let tmpPath = s`${process.cwd()}/.tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingFolderPath = s`${tmpPath}/staging`;

describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;

    function getContents(filename: string) {
        let contents = fsExtra.readFileSync(s`${_stagingFolderPath}/${filename}`).toString();
        return undent(contents);
    }

    describe('CodeCoverageProcessor', () => {
        beforeEach(() => {
            plugin = new RooibosPlugin();
            options = {
                rootDir: _rootDir,
                stagingFolderPath: _stagingFolderPath,
                rooibos: {
                    isRecordingCodeCoverage: true,
                    coverageExcludedFiles: [
                        '**/*.coverageExcluded.bs'
                    ]
                },
                allowBrighterScriptInBrightScript: true
            };
            fsExtra.ensureDirSync(_stagingFolderPath);
            fsExtra.ensureDirSync(_rootDir);

            builder = new ProgramBuilder();
            builder.options = util.normalizeAndResolveConfig(options);
            builder.program = new Program(builder.options);
            program = builder.program;
            program.logger = builder.logger;
            builder.plugins = new PluginInterface([plugin], { logger: builder.logger });
            program.plugins = new PluginInterface([plugin], { logger: builder.logger });
            program.createSourceScope(); //ensure source scope is created
            plugin.beforeProgramCreate(builder);

        });
        afterEach(() => {
            plugin.afterProgramCreate(program);
            builder.dispose();
            program.dispose();
            fsExtra.removeSync(tmpPath);
        });

        describe('basic brs tests', () => {

            // This test fails unless `allowBrighterScriptInBrightScript` is set to true when setting up the program
            // in `beforeEach`. This is because the compiler normally skips processing .brs files and copies them as-is.
            it('adds code coverage to a brs file', async () => {
                program.setFile('source/code.brs', `
                    function new(a1, a2)
                        c = 0
                        text = ""
                        for i = 0 to 10
                            text = text + "hello"
                            c++
                            c += 1
                            if c = 2
                                ? "is true"
                            end if

                            if c = 3
                                ? "free"
                            else
                                ? "not free"
                            end if
                        end for
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();
                let a = getContents('source/code.brs');
                let b = undent(`
                    function new(a1, a2)
                        RBS_CC_0_reportFunction(0)
                        RBS_CC_0_reportLine(3)
                        c = 0
                        RBS_CC_0_reportLine(4)
                        text = ""
                        RBS_CC_0_reportLine(5): for i = 0 to 10
                            RBS_CC_0_reportBranch(0, 0)
                            RBS_CC_0_reportLine(6)
                            text = text + "hello"
                            RBS_CC_0_reportLine(7)
                            c++
                            RBS_CC_0_reportLine(8)
                            c += 1
                            if RBS_CC_0_reportLine(9) and (c = 2)
                                RBS_CC_0_reportBranch(1, 0)
                                RBS_CC_0_reportLine(10)
                                ? "is true"
                            end if
                            if RBS_CC_0_reportLine(13) and (c = 3)
                                RBS_CC_0_reportBranch(2, 0)
                                RBS_CC_0_reportLine(14)
                                ? "free"
                            else
                                RBS_CC_0_reportBranch(2, 1)
                                RBS_CC_0_reportLine(16)
                                ? "not free"
                            end if
                        end for
                    end function

                    function RBS_CC_0_reportLine(lineNumber)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportBranch(blockId, branchId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportFunction(functionId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_branchValue(blockId, branchId, value)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return value
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return value
                        end if
                        return value
                    end function
                `);
                expect(a).to.equal(b);

            });
        });
        describe('basic bs tests', () => {

            it('adds code coverage to a bs file', async () => {
                program.setFile('source/code.bs', `
                    function new(a1, a2)
                    c = 0
                    text = ""
                        for i = 0 to 10
                            text = text + "hello"
                            c++
                            c += 1
                            if c = 2
                                ? "is true"
                            end if

                            if c = 3
                                ? "free"
                            else
                                ? "not free"
                            end if
                        end for
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();
                let a = getContents('source/code.brs');
                let b = undent(`
                    function new(a1, a2)
                        RBS_CC_0_reportFunction(0)
                        RBS_CC_0_reportLine(3)
                        c = 0
                        RBS_CC_0_reportLine(4)
                        text = ""
                        RBS_CC_0_reportLine(5): for i = 0 to 10
                            RBS_CC_0_reportBranch(0, 0)
                            RBS_CC_0_reportLine(6)
                            text = text + "hello"
                            RBS_CC_0_reportLine(7)
                            c++
                            RBS_CC_0_reportLine(8)
                            c += 1
                            if RBS_CC_0_reportLine(9) and (c = 2)
                                RBS_CC_0_reportBranch(1, 0)
                                RBS_CC_0_reportLine(10)
                                ? "is true"
                            end if
                            if RBS_CC_0_reportLine(13) and (c = 3)
                                RBS_CC_0_reportBranch(2, 0)
                                RBS_CC_0_reportLine(14)
                                ? "free"
                            else
                                RBS_CC_0_reportBranch(2, 1)
                                RBS_CC_0_reportLine(16)
                                ? "not free"
                            end if
                        end for
                    end function

                    function RBS_CC_0_reportLine(lineNumber)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportBranch(blockId, branchId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportFunction(functionId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_branchValue(blockId, branchId, value)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return value
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return value
                        end if
                        return value
                    end function
                `);
                expect(a).to.equal(b);

            });
        });

        describe('basic tests', () => {

            it('adds code coverage to a bs file', async () => {
                program.setFile('source/code.bs', `
                    class BasicClass
                        private field1
                        public field2

                        function new(a1, a2)
                        c = 0
                        text = ""
                            for i = 0 to 10
                                text = text + "hello"
                                c++
                                c += 1
                                if c = 2
                                    ? "is true"
                                end if

                                if c = 3
                                    ? "free"
                                else
                                    ? "not free"
                                end if
                            end for

                        end function


                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();
                let a = getContents('source/code.brs');
                let b = undent(`
                    function __BasicClass_method_new(a1, a2)
                        m.field1 = invalid
                        m.field2 = invalid
                        RBS_CC_0_reportFunction(0)
                        RBS_CC_0_reportLine(7)
                        c = 0
                        RBS_CC_0_reportLine(8)
                        text = ""
                        RBS_CC_0_reportLine(9): for i = 0 to 10
                            RBS_CC_0_reportBranch(0, 0)
                            RBS_CC_0_reportLine(10)
                            text = text + "hello"
                            RBS_CC_0_reportLine(11)
                            c++
                            RBS_CC_0_reportLine(12)
                            c += 1
                            if RBS_CC_0_reportLine(13) and (c = 2)
                                RBS_CC_0_reportBranch(1, 0)
                                RBS_CC_0_reportLine(14)
                                ? "is true"
                            end if
                            if RBS_CC_0_reportLine(17) and (c = 3)
                                RBS_CC_0_reportBranch(2, 0)
                                RBS_CC_0_reportLine(18)
                                ? "free"
                            else
                                RBS_CC_0_reportBranch(2, 1)
                                RBS_CC_0_reportLine(20)
                                ? "not free"
                            end if
                        end for
                    end function
                    function __BasicClass_builder()
                        instance = {}
                        instance.new = __BasicClass_method_new
                        return instance
                    end function
                    function BasicClass(a1, a2)
                        instance = __BasicClass_builder()
                        instance.new(a1, a2)
                        return instance
                    end function

                    function RBS_CC_0_reportLine(lineNumber)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportBranch(blockId, branchId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportFunction(functionId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_branchValue(blockId, branchId, value)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return value
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return value
                        end if
                        return value
                    end function
                `);
                expect(a).to.equal(b);
            });

            it('instruments return statements with 1-indexed line numbers', async () => {
                // Source line 3 (1-indexed) is `if value > 0 then`; line 4 is `return "positive"`.
                // The visitor reports range.start.line + 1 so LCOV/Istanbul see the editor-style line numbers.
                program.setFile('source/code.bs', `
                    function classify(value as integer) as string
                        if value > 0 then
                            return "positive"
                        end if
                        return "negative"
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                expect(a).to.include('RBS_CC_0_reportLine(3)');
                expect(a).to.include('RBS_CC_0_reportLine(4)');
                expect(a).to.include('RBS_CC_0_reportLine(6)');
                expect(a).to.include('return "positive"');
                expect(a).to.include('return "negative"');
            });

            it('instruments returns inside a namespaced function', async () => {
                program.setFile('source/code.bs', `
                    namespace bench
                        function classify(value as integer) as string
                            if value > 0 then
                                return "positive"
                            end if
                            return "negative"
                        end function
                    end namespace
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                expect(a).to.include('RBS_CC_0_reportLine(4)'); // line 4 = return "positive"
                expect(a).to.include('RBS_CC_0_reportLine(7)'); // line 7 = return "negative"
            });

            it('instruments single class method with if/else', async () => {
                program.setFile('source/code.bs', `
                    class Calculator
                        function divide(a as integer, b as integer) as integer
                            x = 1
                            if b = 0 then
                                return 0
                            else
                                return a / b
                            end if
                        end function
                    end class
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                console.log('=== SINGLE METHOD CLASS ===\n' + a + '\n=== END ===');
                expect(a).to.include('RBS_CC_0_reportLine(6)'); // return 0
            });

            it('instruments returns in if/else at top level', async () => {
                program.setFile('source/code.bs', `
                    function divide(a as integer, b as integer) as integer
                        if b = 0 then
                            return 0
                        else
                            return a / b
                        end if
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                expect(a).to.include('RBS_CC_0_reportLine(4)'); // return 0
                expect(a).to.include('RBS_CC_0_reportLine(6)'); // return a / b
            });

            it('instruments class method body and returns', async () => {
                program.setFile('source/code.bs', `
                    namespace bench
                        class Calculator
                            function new()
                                m.history = []
                            end function

                            function divide(a as integer, b as integer) as integer
                                if b = 0 then
                                    return 0
                                else
                                    return a / b
                                end if
                            end function
                        end class
                    end namespace
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                expect(a).to.include('RBS_CC_0_reportLine(5)'); // m.history = []
                expect(a).to.include('RBS_CC_0_reportLine(10)'); // return 0
                expect(a).to.include('RBS_CC_0_reportLine(12)'); // return a / b
            });

            it('correctly transpiles some statements', async () => {
                const source = `sub foo()
                    x = function(y)
                        if (true) then
                            return 1
                        end if
                        return 0
                    end function
                end sub`;

                program.setFile('source/code.bs', source);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                let a = getContents('source/code.brs');
                let b = undent(`
                    sub foo()
                        RBS_CC_0_reportFunction(0)
                        RBS_CC_0_reportLine(2)
                        x = function(y)
                            RBS_CC_0_reportFunction(1)
                            if RBS_CC_0_reportLine(3) and ((true)) then
                                RBS_CC_0_reportBranch(0, 0)
                                RBS_CC_0_reportLine(4)
                                return 1
                            end if
                            RBS_CC_0_reportLine(6)
                            return 0
                        end function
                    end sub

                    function RBS_CC_0_reportLine(lineNumber)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportBranch(blockId, branchId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportFunction(functionId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_branchValue(blockId, branchId, value)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return value
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return value
                        end if
                        return value
                    end function
                `);

                expect(a).to.equal(b);
            });

            it('correctly transpiles some statements', async () => {
                const source = `
                    sub foo(action as string)
                        if action = "action1" then
                            print "action1"
                        else if action = "action2" or action = "action2" then
                            print "action2"
                        else if action = "action3" then
                            print "action3"
                        else if action = "action4" then
                        else if action = "action5" then
                            print "action5"
                        else if action = "action6" then
                            print "action6"
                        else if action = "action7" then
                            print "action7"
                        else if action = "action8" then
                            print "action8"
                        else if action = "action9" then
                            print "action9"
                        else if action = "action10" then
                            print "action10"
                        else
                        end if
                    end sub
                `;

                program.setFile('source/code.bs', source);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                let a = getContents('source/code.brs');
                let b = undent(`
                    sub foo(action as string)
                        RBS_CC_0_reportFunction(0)
                        if RBS_CC_0_reportLine(3) and (action = "action1") then
                            RBS_CC_0_reportBranch(0, 0)
                            RBS_CC_0_reportLine(4)
                            print "action1"
                        else if RBS_CC_0_reportLine(5) and (RBS_CC_0_branchValue(2, 0, action = "action2") or RBS_CC_0_branchValue(2, 1, action = "action2")) then
                            RBS_CC_0_reportBranch(1, 0)
                            RBS_CC_0_reportLine(6)
                            print "action2"
                        else if RBS_CC_0_reportLine(7) and (action = "action3") then
                            RBS_CC_0_reportBranch(3, 0)
                            RBS_CC_0_reportLine(8)
                            print "action3"
                        else if RBS_CC_0_reportLine(9) and (action = "action4") then
                            RBS_CC_0_reportBranch(4, 0)
                        else if RBS_CC_0_reportLine(10) and (action = "action5") then
                            RBS_CC_0_reportBranch(5, 0)
                            RBS_CC_0_reportLine(11)
                            print "action5"
                        else if RBS_CC_0_reportLine(12) and (action = "action6") then
                            RBS_CC_0_reportBranch(6, 0)
                            RBS_CC_0_reportLine(13)
                            print "action6"
                        else if RBS_CC_0_reportLine(14) and (action = "action7") then
                            RBS_CC_0_reportBranch(7, 0)
                            RBS_CC_0_reportLine(15)
                            print "action7"
                        else if RBS_CC_0_reportLine(16) and (action = "action8") then
                            RBS_CC_0_reportBranch(8, 0)
                            RBS_CC_0_reportLine(17)
                            print "action8"
                        else if RBS_CC_0_reportLine(18) and (action = "action9") then
                            RBS_CC_0_reportBranch(9, 0)
                            RBS_CC_0_reportLine(19)
                            print "action9"
                        else if RBS_CC_0_reportLine(20) and (action = "action10") then
                            RBS_CC_0_reportBranch(10, 0)
                            RBS_CC_0_reportLine(21)
                            print "action10"
                        else
                            RBS_CC_0_reportBranch(10, 1)
                        end if
                    end sub

                    function RBS_CC_0_reportLine(lineNumber)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "l": lineNumber
                                "r": 1
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportBranch(blockId, branchId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_reportFunction(functionId)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "fn": functionId
                                "r": 4
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function

                    function RBS_CC_0_branchValue(blockId, branchId, value)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            return value
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": 0
                                "bl": blockId
                                "br": branchId
                                "r": 3
                            }
                            m._rbs_ccn = _rbs_ccn
                            return value
                        end if
                        return value
                    end function
                `);

                expect(a).to.equal(b);
            });
        });

        it('excludes files from coverage', async () => {
            const source = `sub foo()
                x = function(y)
                    if (true) then
                        return 1
                    end if
                    return 0
                end function
            end sub`;

            program.setFile('source/code.coverageExcluded.bs', source);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            await builder.transpile();

            let a = getContents('source/code.coverageExcluded.brs');
            let b = undent(`
                sub foo()
                    x = function(y)
                        if (true) then
                            return 1
                        end if
                        return 0
                    end function
                end sub
            `);

            expect(a).to.equal(b);
        });
    });

    // Coverage instrumentation runs first in beforeFileTranspile, then global mock rewriting
    // (see plugin.ts). These tests pin that order: coverage helpers must reach every line/
    // branch/function even when the mock util later prepends a stub-detection prologue,
    // and the rewritten call sites for stubbed globals must still play nice with our
    // expression-level wraps (ternary arms, etc.).
    describe('CodeCoverageProcessor + global mocking interaction', () => {
        beforeEach(() => {
            plugin = new RooibosPlugin();
            options = {
                rootDir: _rootDir,
                stagingFolderPath: _stagingFolderPath,
                rooibos: {
                    isRecordingCodeCoverage: true,
                    isGlobalMethodMockingEnabled: true,
                    isGlobalMethodMockingEfficientMode: false
                },
                allowBrighterScriptInBrightScript: true
            };
            fsExtra.ensureDirSync(_stagingFolderPath);
            fsExtra.ensureDirSync(_rootDir);

            builder = new ProgramBuilder();
            builder.options = util.normalizeAndResolveConfig(options);
            builder.program = new Program(builder.options);
            program = builder.program;
            program.logger = builder.logger;
            builder.plugins = new PluginInterface([plugin], { logger: builder.logger });
            program.plugins = new PluginInterface([plugin], { logger: builder.logger });
            program.createSourceScope();
            plugin.beforeProgramCreate(builder);
        });
        afterEach(() => {
            plugin.afterProgramCreate(program);
            builder.dispose();
            program.dispose();
            fsExtra.removeSync(tmpPath);
        });

        it('keeps coverage helpers and the stub-detection prologue both in the output', async () => {
            program.setFile('source/util.bs', `
                function greet(name as string) as string
                    if name = "" then
                        return "Hello, stranger"
                    end if
                    return "Hello, " + name
                end function
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            await builder.transpile();

            const out = getContents('source/util.brs');

            // Coverage instrumentation is present.
            expect(out).to.include('RBS_CC_0_reportFunction(0)');
            expect(out).to.include('RBS_CC_0_reportLine');
            expect(out).to.include('RBS_CC_0_reportBranch');

            // Global-mock prologue is present (the stub-detection lookup that MockUtil injects).
            expect(out).to.include('__stubs_globalAa');
            expect(out).to.include('__stubOrMockResult');
        });

        it('instruments returns and ternary arms inside a function that also gets the mock prologue', async () => {
            program.setFile('source/util.bs', `
                function classify(value as integer) as string
                    return value >= 0 ? "non-negative" : "negative"
                end function
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            await builder.transpile();

            const out = getContents('source/util.brs');

            // The mock prologue runs before the ternary; both arms are still wrapped with
            // branchValue helpers so coverage tracks the truthy/falsy paths.
            expect(out).to.include('__stubs_globalAa');
            expect(out).to.include('RBS_CC_0_branchValue(0, 0, "non-negative")');
            expect(out).to.include('RBS_CC_0_branchValue(0, 1, "negative")');
        });

        it('does not instrument the synthetic prologue itself - reportFunction stays at the head of the original body', async () => {
            program.setFile('source/util.bs', `
                function greet() as string
                    return "hi"
                end function
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            await builder.transpile();

            const out = getContents('source/util.brs');
            // Sanity: only one reportFunction(0) for greet itself - we shouldn't have
            // accidentally treated the mock prologue's anonymous lookup function as a new
            // user-defined function and registered it for tracking.
            const matches = out.match(/RBS_CC_0_reportFunction\(\d+\)/g) || [];
            const userFunctionRegistrations = matches.filter(m => m === 'RBS_CC_0_reportFunction(0)');
            expect(userFunctionRegistrations.length).to.equal(1);
        });
    });
});
