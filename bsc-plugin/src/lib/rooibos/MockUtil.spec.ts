/* eslint-disable @typescript-eslint/no-confusing-void-expression */
import { Program, ProgramBuilder, util, standardizePath as s } from 'brighterscript';
import { expect } from 'chai';
import * as fsExtra from 'fs-extra';
import { RooibosPlugin } from '../../plugin';

let tmpPath = s`${process.cwd()}/tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingDir = s`${tmpPath}/staging`;

function trimLeading(text: string) {
    return text.split('\n').map((line) => line.trimStart()).join('\n');
}

describe('MockUtil', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;

    function getContents(filename: string) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return trimLeading(fsExtra.readFileSync(s`${_stagingDir}/${filename}`).toString());
    }

    describe('MockUtil', () => {
        beforeEach(() => {
            plugin = new RooibosPlugin();
            options = {
                rootDir: _rootDir,
                stagingDir: _stagingDir,
                rooibos: {
                    isGlobalMethodMockingEnabled: true,
                    globalMethodMockingExcludedFiles: [
                        '**/*.coverageExcluded.brs'
                    ],
                    isGlobalMethodMockingEfficientMode: false
                },
                allowBrighterScriptInBrightScript: true
            };
            fsExtra.emptyDirSync(_stagingDir);
            fsExtra.emptyDirSync(_rootDir);
            fsExtra.emptyDirSync(tmpPath);
            fsExtra.ensureDirSync(_stagingDir);
            fsExtra.ensureDirSync(_rootDir);
            fsExtra.ensureDirSync(tmpPath);

            builder = new ProgramBuilder();
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            builder.options = util.normalizeAndResolveConfig(options);
            builder.program = new Program(builder.options);
            program = builder.program;
            program.plugins.add(plugin);
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
            it('adds util code to a brs file', async () => {
                const file = program.setFile('source/code.brs', `
                function sayHello(a1, a2)
                    print "hello"
                end function
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`function sayHello(a1, a2)
                if RBS_SM_1_getMocksByFunctionName()["sayhello"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["sayhello"].callback(a1,a2)
                return result
                end if
                print "hello"
                end function

                function RBS_SM_1_getMocksByFunctionName()
                if m._rMocksByFunctionName = invalid
                m._rMocksByFunctionName = {}
                end if
                return m._rMocksByFunctionName
                end function
`);
                expect(a).to.equal(b);

            });
        });
        describe('basic bs tests', () => {

            it('enables mocking on global functions', async () => {
                program.setFile('source/code.bs', `
                function sayHello(a1, a2)
                    print "hello"
                end function
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`function sayHello(a1, a2)
                if RBS_SM_1_getMocksByFunctionName()["sayhello"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["sayhello"].callback(a1,a2)
                return result
                end if
                print "hello"
                end function

                function RBS_SM_1_getMocksByFunctionName()
                if m._rMocksByFunctionName = invalid
                m._rMocksByFunctionName = {}
                end if
                return m._rMocksByFunctionName
                end function
`);
                expect(a).to.equal(b);

            });
            it('weird raletracker task issue I saw', async () => {
                program.setFile('source/code.bs', `
                Sub RedLines_SetRulerLines(rulerLines)
                    For Each line In rulerLines.Items()
                        RedLines_AddLine(line.key, line.value.position, line.value.coords, m.node, m.childMap)
                    End For
                end Sub
                Sub RedLines_AddLine(id, position, coords, node, childMap) as Object
                    line = CreateObject("roSGNode", "Rectangle")
                    line.setField("id", id)
                end sub
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`Sub RedLines_SetRulerLines(rulerLines)
                if RBS_SM_1_getMocksByFunctionName()["redlines_setrulerlines"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["redlines_setrulerlines"].callback(rulerLines)
                return
                end if
                For Each line In rulerLines.Items()
                RedLines_AddLine(line.key, line.value.position, line.value.coords, m.node, m.childMap)
                End For
                end Sub

                Sub RedLines_AddLine(id, position, coords, node, childMap) as Object
                if RBS_SM_1_getMocksByFunctionName()["redlines_addline"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["redlines_addline"].callback(id,position,coords,node,childMap)
                return result
                end if
                line = CreateObject("roSGNode", "Rectangle")
                line.setField("id", id)
                end sub

                function RBS_SM_1_getMocksByFunctionName()
                if m._rMocksByFunctionName = invalid
                m._rMocksByFunctionName = {}
                end if
                return m._rMocksByFunctionName
                end function
`);
                expect(a).to.equal(b);

            });

            it('enables mocking on global sub', async () => {
                program.setFile('source/code.bs', `
                sub sayHello(a1, a2)
                    print "hello"
                end sub
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`sub sayHello(a1, a2)
                if RBS_SM_1_getMocksByFunctionName()["sayhello"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["sayhello"].callback(a1,a2)
                return
                end if
                print "hello"
                end sub

                function RBS_SM_1_getMocksByFunctionName()
                if m._rMocksByFunctionName = invalid
                m._rMocksByFunctionName = {}
                end if
                return m._rMocksByFunctionName
                end function
`);
                expect(a).to.equal(b);

            });

            it('enables mocking on namespaced function', async () => {
                program.setFile('source/code.bs', `
                namespace person.utils
                    function sayHello(a1, a2)
                        print "hello"
                    end function
                end namespace
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`function person_utils_sayHello(a1, a2)
                if RBS_SM_1_getMocksByFunctionName()["person_utils_sayhello"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["person_utils_sayhello"].callback(a1,a2)
                return result
                end if
                print "hello"
                end function

                function RBS_SM_1_getMocksByFunctionName()
                if m._rMocksByFunctionName = invalid
                m._rMocksByFunctionName = {}
                end if
                return m._rMocksByFunctionName
                end function
`);
                expect(a).to.equal(b);

            });

            it('enables mocking on namespaced sub', async () => {
                program.setFile('source/code.bs', `
                namespace person.utils
                    sub sayHello(a1, a2)
                        print "hello"
                    end sub
                end namespace
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`sub person_utils_sayHello(a1, a2)
                if RBS_SM_1_getMocksByFunctionName()["person_utils_sayhello"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["person_utils_sayhello"].callback(a1,a2)
                return
                end if
                print "hello"
                end sub

                function RBS_SM_1_getMocksByFunctionName()
                if m._rMocksByFunctionName = invalid
                m._rMocksByFunctionName = {}
                end if
                return m._rMocksByFunctionName
                end function
`);
                expect(a).to.equal(b);

            });

            it('does not affect class methods', async () => {
                program.setFile('source/code.bs', `
                class Person
                    sub sayHello(a1, a2)
                        print "hello"
                    end sub
                end class
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`function __Person_builder()
                instance = {}
                instance.new = sub()
                end sub
                instance.sayHello = sub(a1, a2)
                print "hello"
                end sub
                return instance
                end function
                function Person()
                instance = __Person_builder()
                instance.new()
                return instance
                end function`);
                expect(a).to.equal(b);

            });
            it('will add stub code to namespace and global methods in a file with a class', async () => {
                program.setFile('source/code.bs', `
                namespace beings
                class Person
                    sub sayHello(a1, a2)
                        print "hello"
                    end sub
                end class
                function sayHello()
                    print "hello2"
                end function
                end namespace
                function sayHello()
                    print "hello3"
                end function
            `);
                program.validate();
                expect(program.getDiagnostics()).to.be.empty;
                await builder.build();
                let a = getContents('source/code.brs');
                let b = trimLeading(`function __beings_Person_builder()
                instance = {}
                instance.new = sub()
                end sub
                instance.sayHello = sub(a1, a2)
                print "hello"
                end sub
                return instance
                end function
                function beings_Person()
                instance = __beings_Person_builder()
                instance.new()
                return instance
                end function

                function beings_sayHello()
                if RBS_SM_1_getMocksByFunctionName()["beings_sayhello"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["beings_sayhello"].callback()
                return result
                end if
                print "hello2"
                end function

                function sayHello()
                if RBS_SM_1_getMocksByFunctionName()["sayhello"] <> invalid
                result = RBS_SM_1_getMocksByFunctionName()["sayhello"].callback()
                return result
                end if
                print "hello3"
                end function

                function RBS_SM_1_getMocksByFunctionName()
                if m._rMocksByFunctionName = invalid
                m._rMocksByFunctionName = {}
                end if
                return m._rMocksByFunctionName
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
            await builder.build();

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
