import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { standardizePath as s } from 'brighterscript';
import { buildCoverageDataFromModel, parseCoverageCounts, writeCoverageReportsFromCounts, SourceCache } from './CoverageReporter';
import type { CoverageMap as CoverageModelJson } from './CodeCoverageProcessor';

let tmpPath = s`${process.cwd()}/.tmp/coverageReporter`;

describe('CoverageReporter', () => {

    beforeEach(() => {
        fsExtra.ensureDirSync(tmpPath);
        fsExtra.emptyDirSync(tmpPath);
    });

    afterEach(() => {
        fsExtra.removeSync(tmpPath);
    });

    describe('SourceCache columns', () => {
        it('finds indent and keyword columns, with fallbacks for missing lines', () => {
            const file = path.join(tmpPath, 'columns.brs');
            fs.writeFileSync(file, '    handler = function(a)\n        x = 1\n    end function\n');
            const cache = new SourceCache();
            // indent column of a normal line
            expect(cache.getIndentColumn(file, 2)).to.equal(8);
            // missing line -> 0
            expect(cache.getIndentColumn(file, 99)).to.equal(0);
            // keyword lands on `function`, skipping the `handler = ` prefix
            expect(cache.getKeywordColumn(file, 1)).to.equal(14);
            // no function/sub keyword -> falls back to the indent column
            expect(cache.getKeywordColumn(file, 2)).to.equal(8);
            // missing line -> 0
            expect(cache.getKeywordColumn(file, 99)).to.equal(0);
        });
    });

    describe('parseCoverageCounts', () => {
        it('parses sparse per-file JSON lines and skips the header and console noise', () => {
            const raw = [
                '{"v":1}',
                '{"i":0,"l":{"0":3,"2":1},"f":{"0":4},"b":{"1":[2,0]}}',
                'some interleaved device log line',
                '{"i":5,"l":{},"f":{"1":9},"b":{}}',
                '{not json'
            ].join('\n');

            const counts = parseCoverageCounts(raw);
            expect([...counts.keys()]).to.eql([0, 5]);
            expect(counts.get(0)!.l).to.eql({ '0': 3, '2': 1 });
            expect(counts.get(0)!.b).to.eql({ '1': [2, 0] });
            expect(counts.get(5)!.f).to.eql({ '1': 9 });
        });
    });

    describe('buildCoverageDataFromModel', () => {
        function makeModel(): CoverageModelJson {
            return {
                files: [{
                    sourceFile: 'source/a.bs',
                    sourcePath: 'core/source/a.bs',
                    lines: [
                        { lineNumber: 2, totalHit: 0 },
                        { lineNumber: 4, totalHit: 0, el: 6 },
                        { lineNumber: 8, totalHit: 0 }
                    ],
                    lineTotalFound: 3,
                    lineTotalHit: 0,
                    functions: [{ name: 'doThing', totalHit: 0, startLine: 1, endLine: 9 }],
                    functionTotalFound: 1,
                    functionTotalHit: 0,
                    blocks: [
                        // two-arm if: no implicit-else synthesis
                        { id: 0, isIfArm: true, branches: [
                            { id: 0, totalHit: 0, line: 2 },
                            { id: 1, totalHit: 0, line: 2 }
                        ] },
                        // single-arm if: implicit else synthesized from line evaluations
                        { id: 1, isIfArm: true, branches: [
                            { id: 0, totalHit: 0, line: 8 }
                        ] },
                        // ternary arms with columns -> cond-expr
                        { id: 2, isIfArm: false, branches: [
                            { id: 0, totalHit: 0, line: 4, column: 10, endColumn: 14 },
                            { id: 1, totalHit: 0, line: 4, column: 17, endColumn: 22 }
                        ] }
                    ],
                    branchTotalFound: 5,
                    branchTotalHit: 0
                }]
            } as CoverageModelJson;
        }

        it('builds statements, functions and branches from the model with sparse counts', () => {
            const counts = parseCoverageCounts('{"i":0,"l":{"0":5,"2":5},"f":{"0":5},"b":{"0":[3,2],"1":[2],"2":[4,0]}}');
            const data = buildCoverageDataFromModel(makeModel(), counts, tmpPath);
            const filePath = path.join(tmpPath, 'core', 'source', 'a.bs');
            const fc = data[filePath];
            expect(fc, `expected ${filePath} in ${Object.keys(data).join(',')}`).to.exist;

            // statements: multi-line range from `el`, sparse zero default for line index 1
            expect(fc.statementMap[1]).to.eql({ start: { line: 4, column: 0 }, end: { line: 6, column: 1024 } });
            expect(fc.s).to.eql({ 0: 5, 1: 0, 2: 5 });

            expect(fc.fnMap[0].name).to.equal('doThing');
            expect(fc.f[0]).to.equal(5);

            // two-arm if keeps its arms verbatim
            expect(fc.branchMap[0].type).to.equal('if');
            expect(fc.b[0]).to.eql([3, 2]);
            // single-arm if gains the implicit else: 5 evaluations of line 8 - 2 taken = 3
            expect(fc.b[1]).to.eql([2, 3]);
            expect(fc.branchMap[1].locations).to.have.length(2);
            // ternary arms carry model columns and type cond-expr
            expect(fc.branchMap[2].type).to.equal('cond-expr');
            expect(fc.branchMap[2].locations[0].start.column).to.equal(10);
            expect(fc.b[2]).to.eql([4, 0]);
        });

        it('treats files absent from the counts stream as fully unhit', () => {
            const data = buildCoverageDataFromModel(makeModel(), new Map(), tmpPath);
            const fc = data[path.join(tmpPath, 'core', 'source', 'a.bs')];
            expect(fc.s).to.eql({ 0: 0, 1: 0, 2: 0 });
            expect(fc.f[0]).to.equal(0);
            expect(fc.b[0]).to.eql([0, 0]);
            // implicit else of a never-evaluated if is also 0, not negative
            expect(fc.b[1]).to.eql([0, 0]);
        });

        it('synthesizes a statement for inline if arms from the clause range and arm hits', () => {
            const model = makeModel();
            // make block 1's single arm an inline clause: `if x then return 1` on line 8
            model.files[0].blocks[1].branches[0].sc = 14;
            model.files[0].blocks[1].branches[0].ec = 21;
            const counts = parseCoverageCounts('{"i":0,"l":{"2":5},"f":{},"b":{"1":[2]}}');

            const data = buildCoverageDataFromModel(model, counts, tmpPath);
            const fc = data[path.join(tmpPath, 'core', 'source', 'a.bs')];
            // 3 line statements + 1 synthesized clause statement
            const keys = Object.keys(fc.statementMap);
            expect(keys).to.have.length(4);
            const clause = fc.statementMap[3];
            expect(clause).to.eql({ start: { line: 8, column: 14 }, end: { line: 8, column: 21 } });
            expect(fc.s[3]).to.equal(2);
        });

        it('falls back to sourceFile when the model predates sourcePath', () => {
            const model = makeModel();
            delete model.files[0].sourcePath;
            const data = buildCoverageDataFromModel(model, new Map(), tmpPath);
            expect(Object.keys(data)).to.eql([path.join(tmpPath, 'source', 'a.bs')]);
        });
    });

    describe('writeCoverageReportsFromCounts', () => {
        function makeModel(sourceRoot?: string): CoverageModelJson {
            return {
                sourceRoot: sourceRoot,
                files: [{
                    sourceFile: 'source/a.bs',
                    sourcePath: 'core/source/a.bs',
                    lines: [{ lineNumber: 2, totalHit: 0 }, { lineNumber: 3, totalHit: 0 }],
                    lineTotalFound: 2,
                    lineTotalHit: 0,
                    functions: [{ name: 'doThing', totalHit: 0, startLine: 1, endLine: 4 }],
                    functionTotalFound: 1,
                    functionTotalHit: 0,
                    blocks: [],
                    branchTotalFound: 0,
                    branchTotalHit: 0
                }]
            } as CoverageModelJson;
        }
        const rawCounts = '{"v":1}\n{"i":0,"l":{"0":7},"f":{"0":7},"b":{}}';

        it('writes lcov.info, coverage-final.json and html/index.html into outputDir', async () => {
            const outputDir = path.join(tmpPath, 'coverage');
            await writeCoverageReportsFromCounts({
                rawCounts: rawCounts,
                model: makeModel(tmpPath),
                outputDir: outputDir
            });

            const written = fs.readFileSync(path.join(outputDir, 'lcov.info'), 'utf8');
            expect(written).to.include('SF:core/source/a.bs');
            expect(written).to.include('DA:2,7');
            expect(written).to.include('DA:3,0');
            expect(written).to.include('FN:1,doThing');

            const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'coverage-final.json'), 'utf8'));
            expect(json[path.join(tmpPath, 'core', 'source', 'a.bs')].f[0]).to.equal(7);

            expect(fs.existsSync(path.join(outputDir, 'html', 'index.html'))).to.be.true;
        });

        it('resolves source root from model.sourceRoot', async () => {
            const outputDir = path.join(tmpPath, 'coverage');
            await writeCoverageReportsFromCounts({
                rawCounts: rawCounts,
                model: makeModel(tmpPath),
                outputDir: outputDir
            });

            const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'coverage-final.json'), 'utf8'));
            const keys = Object.keys(json);
            expect(keys).to.have.length(1);
            expect(keys[0]).to.equal(path.join(tmpPath, 'core', 'source', 'a.bs'));
            expect(json[keys[0]].path).to.equal(path.join(tmpPath, 'core', 'source', 'a.bs'));

            const written = fs.readFileSync(path.join(outputDir, 'lcov.info'), 'utf8');
            expect(written).to.include('SF:core/source/a.bs');
            expect(fs.existsSync(path.join(outputDir, 'html', 'index.html'))).to.be.true;
        });

        it('falls back to process.cwd() when model.sourceRoot is absent', async () => {
            const outputDir = path.join(tmpPath, 'coverage');
            await writeCoverageReportsFromCounts({
                rawCounts: rawCounts,
                model: makeModel(),
                outputDir: outputDir
            });

            const json = JSON.parse(fs.readFileSync(path.join(outputDir, 'coverage-final.json'), 'utf8'));
            const keys = Object.keys(json);
            expect(keys).to.have.length(1);
            expect(keys[0]).to.equal(path.resolve(process.cwd(), 'core', 'source', 'a.bs'));
            expect(fs.existsSync(path.join(outputDir, 'html', 'index.html'))).to.be.true;
        });
    });

});
