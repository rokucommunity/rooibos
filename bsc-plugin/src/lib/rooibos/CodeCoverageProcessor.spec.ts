/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { Program, ProgramBuilder, util, standardizePath as s } from 'brighterscript';
import { expect } from 'chai';
import PluginInterface from 'brighterscript/dist/PluginInterface';
import * as fsExtra from 'fs-extra';
import { RooibosPlugin } from '../../plugin';

let tmpPath = s`${process.cwd()}/tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingDir = s`${tmpPath}/staging`;

function trimLeading(text: string) {
    return text.split('\n').map((line) => line.trimStart()).join('\n');
}

describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;

    function getContents(filename: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return trimLeading(fsExtra.readFileSync(s`${_stagingDir}/${filename}`).toString());
    }

    describe('CodeCoverageProcessor', () => {
        beforeEach(() => {
            plugin = new RooibosPlugin();
            options = {
                rootDir: _rootDir,
                stagingDir: _stagingDir,
                rooibos: {
                    isRecordingCodeCoverage: true,
                    coverageExcludedFiles: [
                        '**/*.coverageExcluded.bs'
                    ]
                },
                allowBrighterScriptInBrightScript: true
            };
            fsExtra.ensureDirSync(_stagingDir);
            fsExtra.ensureDirSync(_rootDir);
            fsExtra.ensureDirSync(tmpPath);

            builder = new ProgramBuilder();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            builder.options = util.normalizeAndResolveConfig(options);
            builder.program = new Program(builder.options);
            program = builder.program;
            program.logger = builder.logger;
            builder.plugins = new PluginInterface([plugin], { logger: builder.logger });
            program.plugins = new PluginInterface([plugin], { logger: builder.logger });
            program.createSourceScope(); //ensure source scope is created
            plugin.beforeProgramCreate({ builder: builder });

        });
        afterEach(() => {
            plugin.afterProgramCreate({ program: program, builder: builder });
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
                await builder.transpile();
                let a = getContents('source/code.brs');
                let b = `function new(a1, a2)
RBS_CC_1_reportLine(2, 1)
c = 0
RBS_CC_1_reportLine(3, 1)
text = ""
RBS_CC_1_reportLine(4, 1): for i = 0 to 10
RBS_CC_1_reportLine(5, 1)
text = text + "hello"
RBS_CC_1_reportLine(6, 1)
c++
RBS_CC_1_reportLine(7, 1)
c += 1
if RBS_CC_1_reportLine(8, 3) and c = 2
RBS_CC_1_reportLine(9, 1)
? "is true"
end if
if RBS_CC_1_reportLine(12, 3) and c = 3
RBS_CC_1_reportLine(13, 1)
? "free"
else
RBS_CC_1_reportLine(14, 3)
RBS_CC_1_reportLine(15, 1)
? "not free"
end if
end for
end function

function RBS_CC_1_reportLine(lineNumber, reportType = 1)
if m.global = invalid
'? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
return true
else
if m._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
if m.global._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
m.global.addFields({
"_rbs_ccn": createObject("roSGNode", "CodeCoverage")
})
end if
m._rbs_ccn = m.global._rbs_ccn
end if
end if

m._rbs_ccn.entry = {"f":"1", "l":stri(lineNumber), "r":reportType}
return true
end function
`;
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
                let b = `function new(a1, a2)
RBS_CC_1_reportLine(2, 1)
c = 0
RBS_CC_1_reportLine(3, 1)
text = ""
RBS_CC_1_reportLine(4, 1): for i = 0 to 10
RBS_CC_1_reportLine(5, 1)
text = text + "hello"
RBS_CC_1_reportLine(6, 1)
c++
RBS_CC_1_reportLine(7, 1)
c += 1
if RBS_CC_1_reportLine(8, 3) and c = 2
RBS_CC_1_reportLine(9, 1)
? "is true"
end if
if RBS_CC_1_reportLine(12, 3) and c = 3
RBS_CC_1_reportLine(13, 1)
? "free"
else
RBS_CC_1_reportLine(14, 3)
RBS_CC_1_reportLine(15, 1)
? "not free"
end if
end for
end function

function RBS_CC_1_reportLine(lineNumber, reportType = 1)
if m.global = invalid
'? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
return true
else
if m._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
if m.global._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
m.global.addFields({
"_rbs_ccn": createObject("roSGNode", "CodeCoverage")
})
end if
m._rbs_ccn = m.global._rbs_ccn
end if
end if

m._rbs_ccn.entry = {"f":"1", "l":stri(lineNumber), "r":reportType}
return true
end function
`;
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
                let b = `function __BasicClass_builder()
instance = {}
instance.new = function(a1, a2)
m.field1 = invalid
m.field2 = invalid
RBS_CC_1_reportLine(6, 1)
c = 0
RBS_CC_1_reportLine(7, 1)
text = ""
RBS_CC_1_reportLine(8, 1): for i = 0 to 10
RBS_CC_1_reportLine(9, 1)
text = text + "hello"
RBS_CC_1_reportLine(10, 1)
c++
RBS_CC_1_reportLine(11, 1)
c += 1
if RBS_CC_1_reportLine(12, 3) and c = 2
RBS_CC_1_reportLine(13, 1)
? "is true"
end if
if RBS_CC_1_reportLine(16, 3) and c = 3
RBS_CC_1_reportLine(17, 1)
? "free"
else
RBS_CC_1_reportLine(18, 3)
RBS_CC_1_reportLine(19, 1)
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
if m.global = invalid
'? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
return true
else
if m._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
if m.global._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
m.global.addFields({
"_rbs_ccn": createObject("roSGNode", "CodeCoverage")
})
end if
m._rbs_ccn = m.global._rbs_ccn
end if
end if

m._rbs_ccn.entry = {"f":"1", "l":stri(lineNumber), "r":reportType}
return true
end function
`;
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
                let b = `sub foo()
RBS_CC_1_reportLine(1, 1)
x = function(y)
if RBS_CC_1_reportLine(2, 3) and (true) then
RBS_CC_1_reportLine(3, 1)
return 1
end if
RBS_CC_1_reportLine(5, 1)
return 0
end function
end sub

function RBS_CC_1_reportLine(lineNumber, reportType = 1)
if m.global = invalid
'? "global is not available in this scope!! it is not possible to record coverage: #FILE_PATH#(lineNumber)"
return true
else
if m._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
if m.global._rbs_ccn = invalid
'? "Coverage maps are not created - creating now"
m.global.addFields({
"_rbs_ccn": createObject("roSGNode", "CodeCoverage")
})
end if
m._rbs_ccn = m.global._rbs_ccn
end if
end if

m._rbs_ccn.entry = {"f":"1", "l":stri(lineNumber), "r":reportType}
return true
end function
`;

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
            let b = `sub foo()
x = function(y)
if (true) then
return 1
end if
return 0
end function
end sub`;

            expect(a).to.equal(b);
        });
    });
});
