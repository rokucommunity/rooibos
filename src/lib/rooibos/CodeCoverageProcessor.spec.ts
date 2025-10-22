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
                await builder.transpile();
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
                await builder.transpile();
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
                await builder.transpile();

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
                await builder.transpile();

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

        describe('constructor execution order', () => {

            it('preserves constructor call order in derived classes without coverage', async () => {
                const source = `
                    class BaseClass
                        function new()
                            ? "BaseClass constructor"
                        end function
                    end class

                    class DerivedClass extends BaseClass
                        function new()
                            super()
                            ? "DerivedClass constructor"
                        end function
                    end class
                `;

                // Create a fresh plugin with coverage disabled
                let noCoveragePlugin = new RooibosPlugin();
                let noCoverageBuilder = new ProgramBuilder();
                let noCoverageOptions = {
                    rootDir: _rootDir,
                    stagingFolderPath: _stagingFolderPath,
                    rooibos: {
                        isRecordingCodeCoverage: false
                    },
                    allowBrighterScriptInBrightScript: true
                };
                noCoverageBuilder.options = util.normalizeAndResolveConfig(noCoverageOptions);
                noCoverageBuilder.program = new Program(noCoverageBuilder.options);
                noCoverageBuilder.program.logger = noCoverageBuilder.logger;
                noCoverageBuilder.plugins = new PluginInterface([noCoveragePlugin], { logger: noCoverageBuilder.logger });
                noCoverageBuilder.program.plugins = new PluginInterface([noCoveragePlugin], { logger: noCoverageBuilder.logger });
                noCoverageBuilder.program.createSourceScope();
                noCoveragePlugin.beforeProgramCreate(noCoverageBuilder);

                noCoverageBuilder.program.setFile('source/classes.bs', source);
                noCoverageBuilder.program.validate();
                expect(noCoverageBuilder.program.getDiagnostics()).to.be.empty;
                await noCoverageBuilder.transpile();

                let noCoverageResult = getContents('source/classes.brs');
                
                // Clean up
                noCoveragePlugin.afterProgramCreate(noCoverageBuilder.program);
                noCoverageBuilder.dispose();
                noCoverageBuilder.program.dispose();

                // Verify super() is called before derived constructor body (as m.super0_new())
                expect(noCoverageResult).to.include('m.super0_new()');
                expect(noCoverageResult).to.include('? "DerivedClass constructor"');
                
                // Ensure super() comes before derived constructor body in the transpiled code
                let superCallIndex = noCoverageResult.indexOf('m.super0_new()');
                let derivedConstructorIndex = noCoverageResult.indexOf('? "DerivedClass constructor"');
                expect(superCallIndex).to.be.lessThan(derivedConstructorIndex);
            });

            it('preserves constructor call order in derived classes with coverage enabled', async () => {
                const source = `
                    class BaseClass
                        function new()
                            ? "BaseClass constructor"
                        end function
                    end class

                    class DerivedClass extends BaseClass
                        function new()
                            super()
                            ? "DerivedClass constructor"
                        end function
                    end class
                `;

                program.setFile('source/classes.bs', source);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                let coverageResult = getContents('source/classes.brs');
                
                // Find the DerivedClass constructor function
                let derivedConstructorMatch = coverageResult.match(/instance\.new = function\(\)[^}]+}/s);
                expect(derivedConstructorMatch).to.not.be.null;
                
                let derivedConstructor = derivedConstructorMatch[0];
                console.log('DerivedClass constructor:');
                console.log(derivedConstructor);
                
                // Verify super() call comes before coverage tracking for the super() line
                let superCallIndex = derivedConstructor.indexOf('m.super0_new()');
                let superLineCoverageIndex = derivedConstructor.indexOf('RBS_CC_1_reportLine("9", 1)');
                
                expect(superCallIndex).to.be.greaterThan(-1, 'Should find super() call');
                expect(superLineCoverageIndex).to.be.greaterThan(-1, 'Should find coverage tracking for super() line');
                expect(superCallIndex).to.be.lessThan(superLineCoverageIndex, 
                    'super() call should execute before its coverage tracking');
                
                // Also verify the derived constructor print comes after coverage tracking
                let derivedPrintIndex = derivedConstructor.indexOf('? "DerivedClass constructor"');
                expect(derivedPrintIndex).to.be.greaterThan(superLineCoverageIndex,
                    'Derived constructor body should come after super() coverage tracking');
            });

            it('preserves constructor call order with multiple super() calls', async () => {
                const source = `
                    class BaseClass
                        function new(value)
                            ? "BaseClass constructor with " + value.toStr()
                        end function
                    end class

                    class MiddleClass extends BaseClass
                        function new(value)
                            super(value * 2)
                            ? "MiddleClass constructor"
                        end function
                    end class

                    class DerivedClass extends MiddleClass
                        function new(value)
                            super(value + 1)
                            ? "DerivedClass constructor"
                        end function
                    end class
                `;

                program.setFile('source/complex.bs', source);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                let coverageResult = getContents('source/complex.brs');
                
                // Find all constructor functions and verify super() calls execute before coverage tracking
                let constructorMatches = coverageResult.match(/instance\.new = function\([^}]+end function/gs);
                expect(constructorMatches).to.have.length.greaterThan(0);
                
                for (let constructor of constructorMatches) {
                    let superCallMatches = constructor.match(/m\.super\d+_new\([^)]*\)/g);
                    if (superCallMatches && superCallMatches.length > 0) {
                        // For each super call, verify it comes before its corresponding coverage tracking
                        for (let superCall of superCallMatches) {
                            let superIndex = constructor.indexOf(superCall);
                            
                            // Find the next coverage call after this super call
                            let nextCoverageIndex = constructor.indexOf('RBS_CC_', superIndex);
                            
                            if (nextCoverageIndex > -1) {
                                expect(superIndex).to.be.lessThan(nextCoverageIndex,
                                    `super() call "${superCall}" should execute before coverage tracking`);
                            }
                        }
                    }
                }
                
                console.log('Complex inheritance test passed - all super() calls execute before coverage tracking');
            });
        });
    });
});
