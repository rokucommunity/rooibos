import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { standardizePath as s } from 'brighterscript';
import { normalizeLcovText, buildFileCoverage, buildCoverageDataFromModel, loadCoveragePathMap, parseCoverageCounts, writeCoverageReports, writeCoverageReportsFromCounts, SourceCache } from './CoverageReporter';
import type { LcovFileRecord } from './CoverageReporter';
import type { CoverageMap as CoverageModelJson } from './CodeCoverageProcessor';
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const lcovParse = require('lcov-parse');

let tmpPath = s`${process.cwd()}/.tmp/coverageReporter`;

describe('CoverageReporter', () => {

    beforeEach(() => {
        fsExtra.ensureDirSync(tmpPath);
        fsExtra.emptyDirSync(tmpPath);
    });

    afterEach(() => {
        fsExtra.removeSync(tmpPath);
    });

    describe('normalizeLcovText', () => {
        it('strips CR from console-captured CRLF output', () => {
            const raw = ['TN:', 'SF:source/a.bs', 'DA:5,2', 'end_of_record'].join('\r\n');
            const result = normalizeLcovText(raw);
            expect(result).to.not.include('\r');
            expect(result).to.include('DA:5,2');
        });

        it('collapses modern 3-arg FN rows to the 2-arg form lcov-parse understands', () => {
            const result = normalizeLcovText('SF:source/a.bs\nFN:4,20,doThing\nend_of_record');
            expect(result).to.include('FN:4,doThing');
        });
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

    describe('buildFileCoverage', () => {
        function makeRecord(partial: Partial<LcovFileRecord>): LcovFileRecord {
            return {
                file: 'source/a.bs',
                lines: { details: [] },
                functions: { details: [] },
                branches: { details: [] },
                ...partial
            };
        }
        it('emits one single-line statement per DA row', () => {
            const record = makeRecord({
                lines: { details: [{ line: 10, hit: 3 }, { line: 12, hit: 7 }] }
            });

            const coverage = buildFileCoverage(record, '/tmp/nope/a.bs', new SourceCache());
            const statements = Object.keys(coverage.statementMap).map(key => ({
                startLine: coverage.statementMap[key].start.line,
                endLine: coverage.statementMap[key].end.line,
                hit: coverage.s[key]
            }));
            expect(statements).to.eql([
                { startLine: 10, endLine: 10, hit: 3 },
                { startLine: 12, endLine: 12, hit: 7 }
            ]);
        });

        it('groups branches by block into single if-type decisions with I/E badges', () => {
            const record = makeRecord({
                branches: { details: [
                    { line: 4, block: 0, branch: 0, taken: 5 },
                    { line: 4, block: 0, branch: 1, taken: 0 }
                ] }
            });

            const coverage = buildFileCoverage(record, '/tmp/nope/a.bs', new SourceCache());
            expect(Object.keys(coverage.branchMap)).to.have.length(1);
            expect(coverage.branchMap[0].type).to.equal('if');
            expect(coverage.b[0]).to.eql([5, 0]);
        });
    });

    describe('loadCoveragePathMap', () => {
        it('maps pkg-relative sourceFile to repo-relative sourcePath', () => {
            const jsonPath = path.join(tmpPath, 'CodeCoverage.json');
            fs.writeFileSync(jsonPath, JSON.stringify({
                files: [
                    { sourceFile: './components/a.brs', sourcePath: 'core/src/components/a.brs' },
                    { sourceFile: './source/b.brs' }
                ]
            }));

            const map = loadCoveragePathMap(jsonPath)!;
            expect(map.get('./components/a.brs')).to.equal('core/src/components/a.brs');
            expect(map.has('./source/b.brs')).to.be.false;
        });

        it('returns undefined for missing files and maps without sourcePath data', () => {
            expect(loadCoveragePathMap(path.join(tmpPath, 'nope.json'))).to.be.undefined;

            const jsonPath = path.join(tmpPath, 'CodeCoverage.json');
            fs.writeFileSync(jsonPath, JSON.stringify({ files: [{ sourceFile: './source/b.brs' }] }));
            expect(loadCoveragePathMap(jsonPath)).to.be.undefined;
        });
    });

    describe('writeCoverageReports', () => {
        const rawLcov = [
            'TN:',
            'SF:./source/a.bs',
            'FN:2,6,doThing',
            'FNDA:4,doThing',
            'FNF:1',
            'FNH:1',
            'BRDA:3,0,0,4',
            'BRDA:3,0,1,0',
            'BRF:2',
            'BRH:1',
            'DA:2,4',
            'DA:3,4',
            'DA:4,0',
            'LF:3',
            'LH:2',
            'end_of_record'
        ].join('\n');

        function parse(lcovText: string): Promise<any[]> {
            return new Promise((resolve, reject) => {
                lcovParse.source(lcovText, (err: Error | null, data: any[]) => {
                    return err ? reject(err instanceof Error ? err : new Error(String(err))) : resolve(data);
                });
            });
        }

        it('writes a strictly standard lcov.info with repo-relative SF paths from the path map', async () => {
            const lcovPath = path.join(tmpPath, 'coverage', 'lcov.info');
            await writeCoverageReports({
                rawLcov: rawLcov,
                lcovPath: lcovPath,
                sourceRoot: tmpPath,
                pathMap: new Map([['./source/a.bs', 'core/src/source/a.bs']])
            });

            const written = fs.readFileSync(lcovPath, 'utf8');
            expect(written).to.include('SF:core/src/source/a.bs');
            expect(written).to.include('FN:2,doThing');
            expect(written).to.not.match(/^FN:\d+,\d+,/m);

            // survives a strict lcov parse with the data intact
            const [record] = await parse(written);
            expect(record.file).to.equal('core/src/source/a.bs');
            expect(record.lines.found).to.equal(3);
            expect(record.lines.hit).to.equal(2);
            expect(record.functions.found).to.equal(1);
            expect(record.branches.found).to.equal(2);
            expect(record.branches.hit).to.equal(1);
        });

        it('writes the canonical Istanbul coverage-final.json', async () => {
            const istanbulJsonPath = path.join(tmpPath, 'coverage', 'coverage-final.json');
            await writeCoverageReports({
                rawLcov: rawLcov,
                istanbulJsonPath: istanbulJsonPath,
                sourceRoot: tmpPath,
                pathMap: new Map([['./source/a.bs', 'core/src/source/a.bs']])
            });

            const data = JSON.parse(fs.readFileSync(istanbulJsonPath, 'utf8'));
            const filePath = path.join(tmpPath, 'core', 'src', 'source', 'a.bs');
            const fileCoverage = data[filePath];
            expect(fileCoverage, `expected entry for ${filePath} in ${Object.keys(data).join(', ')}`).to.exist;
            expect(fileCoverage.path).to.equal(filePath);
            // the lcov wire carries no span detail - every DA row is a single-line statement
            const spanStatement = Object.keys(fileCoverage.statementMap)
                .map(key => fileCoverage.statementMap[key])
                .find(loc => loc.start.line === 4);
            expect(spanStatement.end.line).to.equal(4);
            // block-grouped decisions render as if-type I/E badges
            expect(fileCoverage.branchMap[0].type).to.equal('if');
            expect(fileCoverage.b[0]).to.eql([4, 0]);
            expect(fileCoverage.f[0]).to.equal(4);
        });

        it('falls back to sourceRoot-relative SF paths when there is no path map', async () => {
            const lcovPath = path.join(tmpPath, 'coverage', 'lcov.info');
            await writeCoverageReports({
                rawLcov: rawLcov,
                lcovPath: lcovPath,
                sourceRoot: tmpPath
            });

            const written = fs.readFileSync(lcovPath, 'utf8');
            expect(written).to.include('SF:source/a.bs');
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
        function makeModel(): CoverageModelJson {
            return {
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

        it('lcov mode writes the strict lcov and Istanbul JSON', async () => {
            const lcovPath = path.join(tmpPath, 'coverage', 'lcov.info');
            await writeCoverageReportsFromCounts({
                rawCounts: rawCounts,
                model: makeModel(),
                reporter: 'lcov',
                lcovPath: lcovPath,
                istanbulJsonPath: path.join(tmpPath, 'coverage', 'coverage-final.json'),
                sourceRoot: tmpPath
            });

            const written = fs.readFileSync(lcovPath, 'utf8');
            expect(written).to.include('SF:core/source/a.bs');
            expect(written).to.include('DA:2,7');
            expect(written).to.include('DA:3,0');
            expect(written).to.include('FN:1,doThing');
            const json = JSON.parse(fs.readFileSync(path.join(tmpPath, 'coverage', 'coverage-final.json'), 'utf8'));
            expect(json[path.join(tmpPath, 'core', 'source', 'a.bs')].f[0]).to.equal(7);
        });

        it('nyc mode runs nyc report, producing lcov.info and the lcov-report HTML dir', async function test() {
            this.timeout(20000);
            const coverageDir = path.join(tmpPath, 'coverage');
            await writeCoverageReportsFromCounts({
                rawCounts: rawCounts,
                model: makeModel(),
                reporter: 'nyc',
                lcovPath: path.join(coverageDir, 'lcov.info'),
                istanbulJsonPath: path.join(coverageDir, 'coverage-final.json'),
                sourceRoot: tmpPath
            });

            const written = fs.readFileSync(path.join(coverageDir, 'lcov.info'), 'utf8');
            expect(written).to.include('DA:2,7');
            expect(written).to.include('FN:1,doThing');
            expect(fs.existsSync(path.join(coverageDir, 'lcov-report', 'index.html'))).to.be.true;
        });
    });

});
