import { Program, ProgramBuilder, util, standardizePath as s, isExpressionStatement, isCallExpression, isIfStatement } from 'brighterscript';
import type { BinaryExpression, Expression, ExpressionStatement, LiteralExpression, Statement, VariableExpression } from 'brighterscript';
import { expect } from 'chai';
import PluginInterface from 'brighterscript/dist/PluginInterface';
import * as fsExtra from 'fs-extra';
import { RooibosPlugin } from '../../plugin';
import undent from 'undent';
import { expectFunctionContents, expectZeroDiagnostics, getContents, getFunctionAstNode } from '../../testHelpers.spec';
import { CodeCoverageLineType } from './CodeCoverageType';

let tmpPath = s`${process.cwd()}/.tmp`;
let _rootDir = s`${tmpPath}/rootDir`;
let _stagingFolderPath = s`${tmpPath}/staging`;

describe('CodeCoverageProcessor', () => {
    let program: Program;
    let builder: ProgramBuilder;
    let plugin: RooibosPlugin;
    let options;

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
            const transpiledContents = getContents('source/code.brs');
            expectFunctionContents(transpiledContents, 'new', `
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
            `);
            const reportLineFunction = getFunctionAstNode(transpiledContents, 'RBS_CC_1_reportLine');
            expect(reportLineFunction).to.exist;
        });
    });

    describe('basic bs tests', () => {
        it('adds the code coverage function to a file', async () => {
            program.setFile('source/code.bs', `
                function foo()
                    x = 2
                    print x
                end function
            `);
            program.validate();
            expectZeroDiagnostics(program);
            await builder.transpile();
            const transpiledSource = getContents('source/code.brs');
            const funcAst = getFunctionAstNode(transpiledSource, 'RBS_CC_1_reportLine');
            expect(funcAst).to.exist;
            expect(funcAst.func.parameters.map(p => p.name.text)).to.deep.equal(['lineNumber', 'reportType']);
            expectFunctionContents(transpiledSource, 'RBS_CC_1_reportLine', `
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
            `);
        });

        it('adds code coverage reportLine statements to a function', async () => {
            program.setFile('source/code.bs', `
                function foo()
                    x = 2
                    print x
                end function
            `);
            program.validate();
            expectZeroDiagnostics(program);
            await builder.transpile();
            const funcAst = getFunctionAstNode(getContents('source/code.brs'), 'foo');
            expectReportLineFunctionCalls(funcAst.func.body, 'RBS_CC_1_reportLine', { currentLine: 2 });
        });


        it('adds code coverage reportLine statements to a function with if statements', async () => {
            program.setFile('source/code.bs', `
                function foo(x)
                    if x = 1
                       print "one"
                    else if x = 2
                       print "two"
                    else
                       print "other"
                    end if
                end function
            `);
            program.validate();
            expectZeroDiagnostics(program);
            await builder.transpile();
            const transpiledSource = getContents('source/code.brs');
            const funcAst = getFunctionAstNode(transpiledSource, 'foo');
            expectReportLineFunctionCalls(funcAst.func.body, 'RBS_CC_1_reportLine', { currentLine: 2 });
        });

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
            let transpiledContents = getContents('source/code.brs');
            expectFunctionContents(transpiledContents, 'new', `
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
            `);
        });
    });

    describe('basic tests', () => {

        it('adds code coverage to a bs file with a class', async () => {
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
            const transpiledSource = getContents('source/code.brs');
            const funcAst = getFunctionAstNode(transpiledSource, '__BasicClass_method_new');
            expectReportLineFunctionCalls(funcAst.func.body, 'RBS_CC_1_reportLine', { currentLine: 6 });
        });

        it.skip('correctly transpiles some statements', async () => {
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
            expectFunctionContents(getContents('source/code.brs'), 'foo', `
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
            `);
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
});


function expectReportLineFunctionCalls(ast: { statements: Statement[] }, reportLineFuncName: string, opts: { currentLine: number }) {
    let previousStmt: Statement;

    function checkForReportLine(expr: Expression, opts: { currentLine: number }, coverageType: CodeCoverageLineType) {
        expect(isCallExpression(expr), `Expected statement ${opts.currentLine} to be an call expression`).to.be.true;
        if (isCallExpression(expr)) {
            const callExpr = expr;
            let callee = (callExpr.callee as VariableExpression).name;
            expect(callee.text, `Expected callee to be "${reportLineFuncName}"`).to.equal(reportLineFuncName);
            expect(callExpr.args.length).to.be.equal(2);
            let lineArg = callExpr.args[0];
            let reportTypeArg = callExpr.args[1];
            expect((lineArg as LiteralExpression).token.text, `Expected line argument to be "${opts.currentLine.toString()}"`).to.equal(`"${opts.currentLine.toString()}"`);
            expect((reportTypeArg as LiteralExpression).token.text, `Expected report type argument to be "${coverageType}"`).to.equal(`${coverageType}`);
        }
    }

    for (const stmt of ast.statements) {
        if (isIfStatement(stmt)) {
            checkForReportLine((stmt.condition as BinaryExpression).left, opts, CodeCoverageLineType.condition);
            if (stmt.thenBranch) {
                checkForReportLine((stmt.thenBranch.statements[0] as ExpressionStatement).expression, opts, CodeCoverageLineType.branch);
                opts.currentLine++;
                expectReportLineFunctionCalls(stmt.thenBranch, reportLineFuncName, opts);
            }
            if (stmt.elseBranch) {
                if (isIfStatement(stmt.elseBranch)) {
                    expectReportLineFunctionCalls({ statements: [stmt.elseBranch] }, reportLineFuncName, opts);
                } else {
                    checkForReportLine((stmt.elseBranch.statements[0] as ExpressionStatement).expression, opts, CodeCoverageLineType.branch);
                    opts.currentLine++;
                    expectReportLineFunctionCalls(stmt.elseBranch, reportLineFuncName, opts);
                }
            }
        } else if (!isExpressionStatement(stmt) && isExpressionStatement(previousStmt)) {
            checkForReportLine(previousStmt.expression, opts, CodeCoverageLineType.code);
            opts.currentLine++;
            if (isIfStatement(stmt)) {
                expectReportLineFunctionCalls(stmt.thenBranch, reportLineFuncName, opts);
            }
        }
        previousStmt = stmt;

    }
}
