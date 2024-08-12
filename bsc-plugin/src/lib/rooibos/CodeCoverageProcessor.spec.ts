/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { Program, ProgramBuilder, util, standardizePath as s } from 'brighterscript';
import { expect } from 'chai';
import PluginInterface from 'brighterscript/dist/PluginInterface';
import * as fsExtra from 'fs-extra';
import { RooibosPlugin } from '../../plugin';
import undent from 'undent';
import * as path from 'path';

let tmpPath = s`${process.cwd()}/tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingFolderPath = s`${tmpPath}/staging`;

describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;

    function getContents(filename: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        let contents = fsExtra.readFileSync(s`${_stagingFolderPath}/${filename}`).toString();
        return undent(contents);
    }

    describe('CodeCoverageProcessor', () => {
        beforeEach(() => {
            plugin = new RooibosPlugin();
            options = {
                rootDir: _rootDir,
                stagingDir: _stagingFolderPath,
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
            fsExtra.ensureDirSync(tmpPath);

            builder = new ProgramBuilder();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            builder.options = util.normalizeAndResolveConfig(options);
            builder.program = new Program(builder.options);
            program = builder.program;
            program.logger = builder.logger;
            program.plugins.add(plugin);
            program.createSourceScope(); //ensure source scope is created
            plugin.beforeProgramCreate({ builder: builder });
            plugin.afterProgramCreate({ program: program, builder: builder });

        });
        afterEach(() => {
            plugin.afterProgramCreate({ builder: builder, program: program });
            fsExtra.ensureDirSync(tmpPath);
            fsExtra.emptyDirSync(tmpPath);
            builder.dispose();
            program.dispose();
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
                await builder.build();
                let a = getContents('source/code.brs');
                let b = undent(`
                    function new(a1, a2)
                        RBS_CC_1_reportLine("2", 1)
                        c = 0
                        RBS_CC_1_reportLine("3", 1)
                        text = ""
                        RBS_CC_1_reportLine("4", 1): for i = 0 to 10
                            RBS_CC_1_reportLine("5", 1)
                            text = text + "hello"
                            RBS_CC_1_reportLine("6", 1)
                            c++
                            RBS_CC_1_reportLine("7", 1)
                            c += 1
                            if RBS_CC_1_reportLine("8", 2) and (c = 2)
                                RBS_CC_1_reportLine("8", 3)
                                RBS_CC_1_reportLine("9", 1)
                                ? "is true"
                            end if
                            if RBS_CC_1_reportLine("12", 2) and (c = 3)
                                RBS_CC_1_reportLine("12", 3)
                                RBS_CC_1_reportLine("13", 1)
                                ? "free"
                            else
                                RBS_CC_1_reportLine("14", 3)
                                RBS_CC_1_reportLine("15", 1)
                                ? "not free"
                            end if
                        end for
                    end function

                    function RBS_CC_1_reportLine(lineNumber, reportType = 1)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
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
                await builder.build();
                let a = getContents('source/code.brs');
                let b = undent(`
                    function new(a1, a2)
                        RBS_CC_1_reportLine("2", 1)
                        c = 0
                        RBS_CC_1_reportLine("3", 1)
                        text = ""
                        RBS_CC_1_reportLine("4", 1): for i = 0 to 10
                            RBS_CC_1_reportLine("5", 1)
                            text = text + "hello"
                            RBS_CC_1_reportLine("6", 1)
                            c++
                            RBS_CC_1_reportLine("7", 1)
                            c += 1
                            if RBS_CC_1_reportLine("8", 2) and (c = 2)
                                RBS_CC_1_reportLine("8", 3)
                                RBS_CC_1_reportLine("9", 1)
                                ? "is true"
                            end if
                            if RBS_CC_1_reportLine("12", 2) and (c = 3)
                                RBS_CC_1_reportLine("12", 3)
                                RBS_CC_1_reportLine("13", 1)
                                ? "free"
                            else
                                RBS_CC_1_reportLine("14", 3)
                                RBS_CC_1_reportLine("15", 1)
                                ? "not free"
                            end if
                        end for
                    end function

                    function RBS_CC_1_reportLine(lineNumber, reportType = 1)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
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
                await builder.build();
                let a = getContents('source/code.brs');
                let b = undent(`
                function __BasicClass_builder()
                    instance = {}
                    instance.new = function(a1, a2)
                        m.field1 = invalid
                        m.field2 = invalid
                        RBS_CC_1_reportLine("6", 1)
                        c = 0
                        RBS_CC_1_reportLine("7", 1)
                        text = ""
                        RBS_CC_1_reportLine("8", 1): for i = 0 to 10
                            RBS_CC_1_reportLine("9", 1)
                            text = text + "hello"
                            RBS_CC_1_reportLine("10", 1)
                            c++
                            RBS_CC_1_reportLine("11", 1)
                            c += 1
                            if RBS_CC_1_reportLine("12", 2) and (c = 2)
                                RBS_CC_1_reportLine("12", 3)
                                RBS_CC_1_reportLine("13", 1)
                                ? "is true"
                            end if
                            if RBS_CC_1_reportLine("16", 2) and (c = 3)
                                RBS_CC_1_reportLine("16", 3)
                                RBS_CC_1_reportLine("17", 1)
                                ? "free"
                            else
                                RBS_CC_1_reportLine("18", 3)
                                RBS_CC_1_reportLine("19", 1)
                                ? "not free"
                            end if
                        end for
                    end function
                    return instance
                end function
                function BasicClass(a1, a2)
                    instance = __BasicClass_builder()
                    instance.new(a1, a2)
                    return instance
                end function

                function RBS_CC_1_reportLine(lineNumber, reportType = 1)
                    _rbs_ccn = m._rbs_ccn
                    if _rbs_ccn <> invalid
                        _rbs_ccn.entry = {
                            "f": "1"
                            "l": lineNumber
                            "r": reportType
                        }
                        return true
                    end if
                    _rbs_ccn = m?.global?._rbs_ccn
                    if _rbs_ccn <> invalid
                        _rbs_ccn.entry = {
                            "f": "1"
                            "l": lineNumber
                            "r": reportType
                        }
                        m._rbs_ccn = _rbs_ccn
                        return true
                    end if
                    return true
                end function
                `);
                expect(a).to.equal(b);
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
                await builder.build();

                let a = getContents('source/code.brs');
                let b = undent(`
                    sub foo()
                        RBS_CC_1_reportLine("1", 1)
                        x = function(y)
                            if RBS_CC_1_reportLine("2", 2) and ((true)) then
                                RBS_CC_1_reportLine("2", 3)
                                RBS_CC_1_reportLine("3", 1)
                                return 1
                            end if
                            RBS_CC_1_reportLine("5", 1)
                            return 0
                        end function
                    end sub

                    function RBS_CC_1_reportLine(lineNumber, reportType = 1)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
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
                await builder.build();

                let a = getContents('source/code.brs');
                let b = undent(`
                    sub foo(action as string)
                        if RBS_CC_1_reportLine("2", 2) and (action = "action1") then
                            RBS_CC_1_reportLine("2", 3)
                            RBS_CC_1_reportLine("3", 1)
                            print "action1"
                        else if RBS_CC_1_reportLine("4", 2) and (action = "action2" or action = "action2") then
                            RBS_CC_1_reportLine("4", 3)
                            RBS_CC_1_reportLine("5", 1)
                            print "action2"
                        else if RBS_CC_1_reportLine("6", 2) and (action = "action3") then
                            RBS_CC_1_reportLine("6", 3)
                            RBS_CC_1_reportLine("7", 1)
                            print "action3"
                        else if RBS_CC_1_reportLine("8", 2) and (action = "action4") then
                            RBS_CC_1_reportLine("8", 3)
                        else if RBS_CC_1_reportLine("9", 2) and (action = "action5") then
                            RBS_CC_1_reportLine("9", 3)
                            RBS_CC_1_reportLine("10", 1)
                            print "action5"
                        else if RBS_CC_1_reportLine("11", 2) and (action = "action6") then
                            RBS_CC_1_reportLine("11", 3)
                            RBS_CC_1_reportLine("12", 1)
                            print "action6"
                        else if RBS_CC_1_reportLine("13", 2) and (action = "action7") then
                            RBS_CC_1_reportLine("13", 3)
                            RBS_CC_1_reportLine("14", 1)
                            print "action7"
                        else if RBS_CC_1_reportLine("15", 2) and (action = "action8") then
                            RBS_CC_1_reportLine("15", 3)
                            RBS_CC_1_reportLine("16", 1)
                            print "action8"
                        else if RBS_CC_1_reportLine("17", 2) and (action = "action9") then
                            RBS_CC_1_reportLine("17", 3)
                            RBS_CC_1_reportLine("18", 1)
                            print "action9"
                        else if RBS_CC_1_reportLine("19", 2) and (action = "action10") then
                            RBS_CC_1_reportLine("19", 3)
                            RBS_CC_1_reportLine("20", 1)
                            print "action10"
                        else
                            RBS_CC_1_reportLine("21", 3)
                        end if
                    end sub

                    function RBS_CC_1_reportLine(lineNumber, reportType = 1)
                        _rbs_ccn = m._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            return true
                        end if
                        _rbs_ccn = m?.global?._rbs_ccn
                        if _rbs_ccn <> invalid
                            _rbs_ccn.entry = {
                                "f": "1"
                                "l": lineNumber
                                "r": reportType
                            }
                            m._rbs_ccn = _rbs_ccn
                            return true
                        end if
                        return true
                    end function
                `);

                expect(a).to.equal(b);
            });
        });

        it.only('adds code coverage in conditional compile statements', async () => {
            program.setFile('source/code.bs', `
                #const DEBUG = true
                sub test()
                    #if DEBUG
                        print "debug"
                    #else
                        print "not debug"
                    #end if
                end sub
            `);
            program.validate();
            expect(program.getDiagnostics()).to.be.empty;
            await builder.build();
            let a = getContents('source/code.brs');
            let b = undent(`
                #const DEBUG = true

                sub test()
                    #if DEBUG
                        RBS_CC_1_reportLine("3", 4)
                        RBS_CC_1_reportLine("4", 1)
                        print "debug"
                    #else
                        RBS_CC_1_reportLine("5", 4)
                        RBS_CC_1_reportLine("6", 1)
                        print "not debug"
                    #end if
                end sub

                function RBS_CC_1_reportLine(lineNumber, reportType = 1)
                    _rbs_ccn = m._rbs_ccn
                    if _rbs_ccn <> invalid
                        _rbs_ccn.entry = {
                            "f": "1"
                            "l": lineNumber
                            "r": reportType
                        }
                        return true
                    end if
                    _rbs_ccn = m?.global?._rbs_ccn
                    if _rbs_ccn <> invalid
                        _rbs_ccn.entry = {
                            "f": "1"
                            "l": lineNumber
                            "r": reportType
                        }
                        m._rbs_ccn = _rbs_ccn
                        return true
                    end if
                    return true
                end function
            `);
            expect(a).to.equal(b);
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
            await builder.build();

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
});
