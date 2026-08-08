import { expect } from 'chai';
import { extractLcovExtensions, buildFileCoverage, fixupReportHtml, SourceCache } from './CoverageHtmlGenerator';
import type { LcovFileRecord } from './CoverageHtmlGenerator';

describe('CoverageHtmlGenerator', () => {

    describe('extractLcovExtensions', () => {
        it('extracts RBSCOL and RBSSPAN lines and strips them from the lcov text', () => {
            const raw = [
                'TN:',
                'SF:source/a.bs',
                'DA:5,2',
                'RBSCOL:3,1,10,24',
                'RBSSPAN:5,9',
                'end_of_record'
            ].join('\r\n');

            const result = extractLcovExtensions(raw);
            expect(result.branchColumns.get('source/a.bs:3:1')).to.eql({ startColumn: 10, endColumn: 24 });
            expect(result.statementSpans.get('source/a.bs:5')).to.equal(9);
            expect(result.cleanLcov).to.not.include('RBSCOL');
            expect(result.cleanLcov).to.not.include('RBSSPAN');
            expect(result.cleanLcov).to.include('DA:5,2');
        });

        it('keys extensions by the current SF so identical block ids in different files do not collide', () => {
            const raw = [
                'SF:source/a.bs',
                'RBSCOL:0,0,1,2',
                'end_of_record',
                'SF:source/b.bs',
                'RBSCOL:0,0,3,4',
                'end_of_record'
            ].join('\n');

            const result = extractLcovExtensions(raw);
            expect(result.branchColumns.get('source/a.bs:0:0')).to.eql({ startColumn: 1, endColumn: 2 });
            expect(result.branchColumns.get('source/b.bs:0:0')).to.eql({ startColumn: 3, endColumn: 4 });
        });

        it('collapses modern 3-arg FN rows to the 2-arg form lcov-parse understands', () => {
            const result = extractLcovExtensions('SF:source/a.bs\nFN:4,20,doThing\nend_of_record');
            expect(result.cleanLcov).to.include('FN:4,doThing');
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
        const emptyExtensions = () => extractLcovExtensions('');

        it('expands RBSSPAN into synthetic per-line statements carrying the anchor hit count', () => {
            const extensions = extractLcovExtensions('SF:source/a.bs\nRBSSPAN:10,13\nend_of_record');
            const record = makeRecord({
                lines: { details: [{ line: 10, hit: 3 }, { line: 12, hit: 7 }] }
            });

            const coverage = buildFileCoverage(record, '/tmp/nope/a.bs', extensions, new SourceCache());
            const statements = Object.keys(coverage.statementMap).map(key => ({
                line: coverage.statementMap[key].start.line,
                hit: coverage.s[key]
            }));
            // anchor(10) + continuations 11 and 13 with the anchor's count; line 12 keeps
            // its own DA entry and count
            expect(statements).to.deep.include.members([
                { line: 10, hit: 3 },
                { line: 11, hit: 3 },
                { line: 13, hit: 3 },
                { line: 12, hit: 7 }
            ]);
            expect(statements.filter(s => s.line === 12)).to.have.length(1);
        });

        it('groups branches by block and uses if-type badges when no column data exists', () => {
            const record = makeRecord({
                branches: { details: [
                    { line: 4, block: 0, branch: 0, taken: 5 },
                    { line: 4, block: 0, branch: 1, taken: 0 }
                ] }
            });

            const coverage = buildFileCoverage(record, '/tmp/nope/a.bs', emptyExtensions(), new SourceCache());
            expect(Object.keys(coverage.branchMap)).to.have.length(1);
            expect(coverage.branchMap[0].type).to.equal('if');
            expect(coverage.b[0]).to.eql([5, 0]);
        });

        it('uses cond-expr wraps when RBSCOL column data covers every arm', () => {
            const extensions = extractLcovExtensions('SF:source/a.bs\nRBSCOL:2,0,4,9\nRBSCOL:2,1,12,20\nend_of_record');
            const record = makeRecord({
                branches: { details: [
                    { line: 8, block: 2, branch: 0, taken: 1 },
                    { line: 8, block: 2, branch: 1, taken: 0 }
                ] }
            });

            const coverage = buildFileCoverage(record, '/tmp/nope/a.bs', extensions, new SourceCache());
            expect(coverage.branchMap[0].type).to.equal('cond-expr');
            expect(coverage.branchMap[0].locations[0].start.column).to.equal(4);
            expect(coverage.branchMap[0].locations[1].end.column).to.equal(20);
        });
    });

    describe('fixupReportHtml', () => {
        it('retitles if-badges that sit on loop lines and strips prettyprint', () => {
            const html = [
                '<pre class="prettyprint lang-js">',
                '<span class="missing-if-branch" title="if path not taken">I</span>for i = 0 to 10',
                '<span class="missing-if-branch" title="if path not taken">I</span>if thing then',
                '</pre>'
            ].join('\n');

            const fixed = fixupReportHtml(html);
            expect(fixed).to.include('<pre>');
            const lines = fixed.split('\n');
            expect(lines[1]).to.include('title="loop body never entered"');
            expect(lines[2]).to.include('title="if path not taken"');
        });
    });
});
