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

        describe('basic tests', () => {

            it('adds code coverage to a bs file', async () => {
                program.addOrReplaceFile('source/code.bs', `
                class BasicClass
                    private field1
                    public field2

                    function a(a1, a2)
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
                let b = ``;
                expect(normalizePaths(a)).to.equal(normalizePaths(b));

            });
        });
    });
});
