import { Program, ProgramBuilder, util, standardizePath as s } from 'brighterscript';
import { expect } from 'chai';
import PluginInterface from 'brighterscript/dist/PluginInterface';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
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
                            RBS_CC_0_reportLine(6)
                            text = text + "hello"
                            RBS_CC_0_reportLine(7)
                            c++
                            RBS_CC_0_reportLine(8)
                            c += 1
                            if RBS_CC_0_reportLine(9) and (c = 2)
                                RBS_CC_0_reportBranch(0, 0)
                                RBS_CC_0_reportLine(10)
                                ? "is true"
                            end if
                            if RBS_CC_0_reportLine(13) and (c = 3)
                                RBS_CC_0_reportBranch(1, 0)
                                RBS_CC_0_reportLine(14)
                                ? "free"
                            else
                                RBS_CC_0_reportBranch(1, 1)
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

            it('records a repo-relative sourcePath in CodeCoverage.json', async () => {
                program.setFile('source/code.brs', `
                    function new()
                        c = 0
                    end function
                `);
                program.validate();
                await builder.transpile();

                const report = fsExtra.readJsonSync(s`${_stagingFolderPath}/components/rooibos/CodeCoverage.json`);
                // the nearest git root above .tmp is this repo's own root, so the recorded
                // path is the srcPath relative to it (posix separators)
                let gitRoot = process.cwd();
                while (!fsExtra.existsSync(path.join(gitRoot, '.git')) && path.dirname(gitRoot) !== gitRoot) {
                    gitRoot = path.dirname(gitRoot);
                }
                const expected = path.relative(gitRoot, s`${_rootDir}/source/code.brs`).replace(/\\/g, '/');
                // sourceFile keeps its pkg-relative form (the exact prefix depends on the
                // bsc version's pkgPath) - the device echoes it verbatim into SF lines and
                // the CLI uses it verbatim as the path-map key, so it only has to be
                // self-consistent. sourcePath is the new repo-relative field.
                expect(report.files[0].sourceFile.replace(/^\.\//, '')).to.equal('source/code.brs');
                expect(report.files[0].sourcePath).to.equal(expected);
            });

            it('records the clause column range for inline if arms', async () => {
                const source = `
                    function new(c)
                        if c = 2 then return 1
                        if c = 3
                            return 2
                        end if
                        return 0
                    end function
                `;
                program.setFile('source/code.brs', source);
                program.validate();
                await builder.transpile();

                const report = fsExtra.readJsonSync(s`${_stagingFolderPath}/components/rooibos/CodeCoverage.json`);
                const blocks = report.files[0].blocks;
                const inlineArm = blocks.flatMap(b => b.branches).find(b => b.sc !== undefined);
                expect(inlineArm, 'expected an inline arm with a clause range').to.exist;
                // self-validating: the recorded range must cover exactly the inline clause
                const sourceLine = source.split('\n')[inlineArm.line - 1];
                expect(sourceLine.substring(inlineArm.sc, inlineArm.ec + 1)).to.equal('return 1');
                // multi-line arms don't get clause ranges
                const blockArm = blocks.flatMap(b => b.branches).find(b => b.line !== inlineArm.line && b.sc === undefined);
                expect(blockArm).to.exist;
            });

            it('registers every runtime-reported line in the coverage model (no orphan reportLine calls)', async () => {
                // the device consumer drops hits for lines missing from file.lines, so a
                // reportLine call without a model entry is silently discarded coverage -
                // the while header regressed this way once
                program.setFile('source/code.bs', `
                    function loops(items)
                        i = 0
                        while i < 10
                            i++
                        end while
                        for j = 0 to 5
                            i += j
                        end for
                        for each item in items
                            i += item
                        end for
                        try
                            i += 1
                        catch e
                            i = -1
                        end try
                        return i
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                const report = fsExtra.readJsonSync(s`${_stagingFolderPath}/components/rooibos/CodeCoverage.json`);
                const modelLines = new Set(report.files[0].lines.map((l) => l.lineNumber));
                const reported = new Set<number>();
                const reportLineRegex = /RBS_CC_0_reportLine\((\d+)\)/g;
                let lineMatch = reportLineRegex.exec(a);
                while (lineMatch) {
                    reported.add(parseInt(lineMatch[1], 10));
                    lineMatch = reportLineRegex.exec(a);
                }
                expect(reported.size).to.be.greaterThan(0);
                expect([...reported].filter((n) => !modelLines.has(n))).to.eql([]);
                // the while header (line 4 of the source above) must be a tracked line
                expect(modelLines.has(4)).to.be.true;
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
                            RBS_CC_0_reportLine(6)
                            text = text + "hello"
                            RBS_CC_0_reportLine(7)
                            c++
                            RBS_CC_0_reportLine(8)
                            c += 1
                            if RBS_CC_0_reportLine(9) and (c = 2)
                                RBS_CC_0_reportBranch(0, 0)
                                RBS_CC_0_reportLine(10)
                                ? "is true"
                            end if
                            if RBS_CC_0_reportLine(13) and (c = 3)
                                RBS_CC_0_reportBranch(1, 0)
                                RBS_CC_0_reportLine(14)
                                ? "free"
                            else
                                RBS_CC_0_reportBranch(1, 1)
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
                            RBS_CC_0_reportLine(10)
                            text = text + "hello"
                            RBS_CC_0_reportLine(11)
                            c++
                            RBS_CC_0_reportLine(12)
                            c += 1
                            if RBS_CC_0_reportLine(13) and (c = 2)
                                RBS_CC_0_reportBranch(0, 0)
                                RBS_CC_0_reportLine(14)
                                ? "is true"
                            end if
                            if RBS_CC_0_reportLine(17) and (c = 3)
                                RBS_CC_0_reportBranch(1, 0)
                                RBS_CC_0_reportLine(18)
                                ? "free"
                            else
                                RBS_CC_0_reportBranch(1, 1)
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

        // Roku raises "Internal limit size exceeded" (&hae) when a single expression holds
        // too many logical operators / calls (measured on-device: plain or-chains die at 29
        // operators, flat call-chains at ~22, and nested wrapper calls at just 8 terms).
        // These tests pin the three safeguards: flat leaf wraps, helper extraction for
        // over-budget boolean conditions, and skip-with-warning everywhere else.
        describe('compiler limit safeguards', () => {
            it('wraps logical chains flat - one shared block, no nested branchValue wraps', async () => {
                program.setFile('source/code.bs', `
                    function anyMatch(a as integer, b as integer, c as integer, d as integer) as boolean
                        if a = 1 or b = 2 or c = 3 or d = 4
                            return true
                        end if
                        return false
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                // all four leaves share one block id with sequential branch ids
                const wrapRegex = /RBS_CC_0_branchValue\((\d+), (\d+),/g;
                const blockIds: Array<[string, string]> = [];
                let wrapMatch = wrapRegex.exec(a);
                while (wrapMatch) {
                    blockIds.push([wrapMatch[1], wrapMatch[2]]);
                    wrapMatch = wrapRegex.exec(a);
                }
                expect(blockIds.map(x => x[1])).to.eql(['0', '1', '2', '3']);
                expect(new Set(blockIds.map(x => x[0])).size).to.equal(1);
                // and no wrap is nested inside another wrap's argument
                expect(a).to.not.match(/branchValue\(\d+, \d+, RBS_CC_0_branchValue/);
            });

            it('extracts an over-budget if-condition into a generated short-circuit ladder helper', async () => {
                program.setFile('source/code.bs', `
                    function chk(n as integer, limit as integer) as boolean
                        return n > limit
                    end function

                    function hot() as boolean
                        limit = 5
                        if chk(1, limit) or chk(2, limit) or chk(3, limit) or chk(4, limit) or chk(5, limit) or chk(6, limit) or chk(7, limit) or chk(8, limit) or chk(9, limit) or chk(10, limit) or chk(11, limit) or chk(12, limit)
                            return true
                        end if
                        return false
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                // condition replaced with a call to the generated helper, locals passed through
                expect(a).to.match(/if RBS_CC_0_reportLine\(\d+\) and \(RBS_CC_0_cx0\(limit\)\)/);
                // helper contains the sequential ladder: one leaf per statement, each step
                // folding with the NATIVE operator, guarded by the device's measured
                // short-circuit rule (only a BOOLEAN accumulator short-circuits; integer
                // and float operands always evaluate the next operand and fold bitwise)
                expect(a).to.include('function RBS_CC_0_cx0(limit)');
                expect(a).to.match(/__rbs_r = RBS_CC_0_branchValue\(\d+, 0, chk\(1, limit\)\)/);
                expect(a).to.match(/__rbs_r = __rbs_r or RBS_CC_0_branchValue\(\d+, 11, chk\(12, limit\)\)/);
                expect(a).to.include('if (type(__rbs_r) <> "Boolean" and type(__rbs_r) <> "roBoolean") or not __rbs_r');
                expect(a).to.include('return __rbs_r');
                // no step may bare-reassign a later operand into __rbs_r - that would
                // replace the bitwise accumulation with truthiness of the last operand
                expect(a).to.not.match(/or not __rbs_r\r?\n\s*__rbs_r = RBS_CC_0_branchValue/);
                // the original giant expression is gone from the if statement
                expect(a).to.not.include('chk(1, limit) or chk(2, limit)');
            });

            it('preserves integer bitwise and/or semantics in the extraction ladder', async () => {
                // `if maskA and maskB` with integers is BITWISE on-device (1 and 2 = 0 takes
                // the false branch), so the ladder must fold with the native operator and
                // park the accumulator in a temp around nested runs.
                let orTerms = '';
                for (let i = 1; i <= 11; i++) {
                    orTerms += ` or chk(${i}, limit)`;
                }
                program.setFile('source/code.bs', `
                    function chk(n as integer, limit as integer) as boolean
                        return n > limit
                    end function

                    function hot(maskA as integer, maskB as integer) as boolean
                        limit = 5
                        if chk(0, limit) or (maskA and maskB)${orTerms}
                            return true
                        end if
                        return false
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                expect(a).to.include('function RBS_CC_0_cx0(');
                // the nested and-run parks the or-run's accumulated value in a temp,
                // evaluates with the native `and`, then folds back with the native `or`
                expect(a).to.match(/__rbs_r = __rbs_r and RBS_CC_0_branchValue\(\d+, \d+, maskB\)/);
                expect(a).to.match(/__rbs_t0 = __rbs_r/);
                expect(a).to.match(/__rbs_r = __rbs_t0 or __rbs_r/);
                // guards must be type-aware: an integer accumulator never short-circuits
                // on-device (0 and f() still calls f), only a boolean one does - intrinsic
                // Boolean or boxed roBoolean alike
                expect(a).to.include('if (type(__rbs_r) <> "Boolean" and type(__rbs_r) <> "roBoolean") or __rbs_r');
                expect(a).to.include('if (type(__rbs_r) <> "Boolean" and type(__rbs_r) <> "roBoolean") or not __rbs_r');
                expect(a).to.not.match(/if __rbs_r\r?\n/);
                expect(a).to.not.match(/if not __rbs_r\r?\n/);
            });

            it('leaves the condition untouched when the wrap depends on an extraction that fails', async () => {
                // 18 distinct locals exceed MAX_HELPER_PARAMS (16), so extraction is
                // impossible; the wrap must not be applied on the bet that extraction
                // will shrink the condition - shipping wrap + original would &hae
                let decls = '';
                const terms = [];
                for (let i = 1; i <= 18; i++) {
                    decls += `v${i} = ${i}\n                        `;
                    terms.push(`v${i} > 0`);
                }
                program.setFile('source/code.bs', `
                    function hot() as boolean
                        ${decls}if ${terms.join(' or ')}
                            return true
                        end if
                        return false
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                // no helper was generated, no condition wrap, no leaf wraps
                expect(a).to.not.include('RBS_CC_0_cx');
                expect(a).to.not.match(/if RBS_CC_0_reportLine\(\d+\) and/);
                expect(a).to.not.match(/branchValue\(\d/);
                // the if line is still reported via a plain statement inserted before it
                expect(a).to.match(/RBS_CC_0_reportLine\(\d+\)\r?\n\s*if v1 > 0/);
            });

            it('skips branch wraps for over-budget expressions outside boolean context', async () => {
                program.setFile('source/code.bs', `
                    function chk(n as integer) as boolean
                        return n > 5
                    end function

                    function hot() as boolean
                        x = chk(1) or chk(2) or chk(3) or chk(4) or chk(5) or chk(6) or chk(7) or chk(8) or chk(9) or chk(10) or chk(11) or chk(12)
                        return x
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                // the assignment's line is still reported, but the expression is untouched -
                // no wraps, no helper (value context could be bitwise, so no ladder either)
                expect(a).to.include('x = chk(1) or chk(2) or chk(3)');
                expect(a).to.not.match(/branchValue\(\d/);
                expect(a).to.not.include('RBS_CC_0_cx');
            });

            it('splits long elseif chains into nested fresh chains (per-chain &hae cap)', async () => {
                (plugin as any).codeCoverageProcessor.config.coverageMaxIfChainArms = 3;
                let arms = '';
                for (let i = 1; i <= 8; i++) {
                    arms += `${i === 1 ? 'if' : 'else if'} v = ${i}\n    m.x = ${i}\n`;
                }
                program.setFile('source/code.bs', `
                    sub pick(v as integer)
                        ${arms}end if
                    end sub
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                // the chain was restructured: `else if` becomes `else` + nested `if`, which
                // starts a fresh chain for the compiler while behaving identically (the
                // synthetic else arm picks up its own reportBranch like any else block)
                expect(a).to.match(/else\r?\n\s*RBS_CC_0_reportBranch\(\d+, \d+\)\r?\n\s*if RBS_CC_0_reportLine/);
                // all 8 arms are still present and instrumented
                for (let i = 1; i <= 8; i++) {
                    expect(a).to.include(`m.x = ${i}`);
                }
            });

            it('falls back to function-only coverage when a file would break the 2MiB cap', async () => {
                (plugin as any).codeCoverageProcessor.config.coverageMaxFileBytes = 10;
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
                // functions still report so the FN: section stays meaningful...
                expect(a).to.include('RBS_CC_0_reportFunction(0)');
                // ...but no line/branch instrumentation is emitted (definitions of the
                // helpers themselves still exist, so match call-shape only)
                expect(a).to.not.match(/RBS_CC_0_reportLine\(\d/);
                expect(a).to.not.match(/RBS_CC_0_reportBranch\(\d/);
            });

            it('tracks class methods in function-only mode (methods dispatch as MethodStatement)', async () => {
                (plugin as any).codeCoverageProcessor.config.coverageMaxFileBytes = 10;
                program.setFile('source/code.bs', `
                    class Calculator
                        function add(a as integer, b as integer) as integer
                            return a + b
                        end function

                        sub reset()
                            m.total = 0
                        end sub
                    end class

                    function topLevel() as boolean
                        return true
                    end function
                `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.transpile();

                const a = getContents('source/code.brs');
                // both class methods and the top-level function get entry reports
                expect(a).to.include('RBS_CC_0_reportFunction(0)');
                expect(a).to.include('RBS_CC_0_reportFunction(1)');
                expect(a).to.include('RBS_CC_0_reportFunction(2)');
                expect(a).to.not.match(/RBS_CC_0_reportLine\(\d/);

                const report = fsExtra.readJsonSync(s`${_stagingFolderPath}/components/rooibos/CodeCoverage.json`);
                const names = report.files[0].functions.map((f) => f.name);
                expect(names).to.include('add');
                expect(names).to.include('reset');
                expect(names).to.include('topLevel');
            });
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
