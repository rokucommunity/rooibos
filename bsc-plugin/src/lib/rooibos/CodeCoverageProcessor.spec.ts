/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { DiagnosticSeverity, Program, ProgramBuilder, util } from 'brighterscript';
import { expect } from 'chai';
import PluginInterface from 'brighterscript/dist/PluginInterface';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { RooibosPlugin } from '../../plugin';
import { standardizePath as s } from './Utils';


import { trimLeading } from '../utils/testHelpers.spec';

let tmpPath = s`${process.cwd()}/tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingFolderPath = s`${tmpPath}/staging`;


describe('RooibosPlugin', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;

    function normalizePaths(s: string) {
        return s.replace(/file:.*test.spec.bs/gim, 'FILE_PATH');
    }

    function getContents(filename: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return trimLeading(fsExtra.readFileSync(s`${_stagingFolderPath}/${filename}`).toString());
    }

    describe.only('CodeCoverageProcessor', () => {
        beforeEach(() => {
            plugin = new RooibosPlugin();
            options = {
                rootDir: _rootDir,
                stagingFolderPath: _stagingFolderPath,
                rooibos: {
                    isRecordingCodeCoverage: true
                }
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
            builder.plugins = new PluginInterface([plugin], builder.logger);
            program.plugins = new PluginInterface([plugin], builder.logger);
            program.createSourceScope(); //ensure source scope is created
            plugin.beforeProgramCreate(builder);


        });
        afterEach(() => {
            fsExtra.ensureDirSync(tmpPath);
            fsExtra.emptyDirSync(tmpPath);
            builder.dispose();
            program.dispose();
        });

        describe('basic brs tests', () => {

            //This test is failing - need to ask Bron why the updated ast isn't persisted.
            it.skip('adds code coverage to a brs file', async () => {
                program.addOrReplaceFile('source/code.brs', `
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
                let b = ``;
                expect(normalizePaths(a)).to.equal(normalizePaths(b));

            });
        });
        describe('basic bs tests', () => {

            it('adds code coverage to a bs file', async () => {
                program.addOrReplaceFile('source/code.bs', `
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
if RBS_CC_1_reportLine(8, 3) And c = 2 then

RBS_CC_1_reportLine(9, 1)
? "is true"
end if
if RBS_CC_1_reportLine(12, 3) And c = 3 then

RBS_CC_1_reportLine(13, 1)
? "free"
else
RBS_CC_1_reportLine(14, 3)

RBS_CC_1_reportLine(15, 1)
? "not free"
end if
end for
end function`;
                expect(a).to.equal(b);

            });
        });

        describe('basic tests', () => {

            it('adds code coverage to a bs file', async () => {
                program.addOrReplaceFile('source/code.bs', `
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
if RBS_CC_1_reportLine(12, 3) And c = 2 then

RBS_CC_1_reportLine(13, 1)
? "is true"
end if
if RBS_CC_1_reportLine(16, 3) And c = 3 then

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
end function`;
                expect(a).to.equal(b);
            });
        });
    });
});
