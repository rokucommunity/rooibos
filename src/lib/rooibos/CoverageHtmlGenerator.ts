import * as fs from 'fs';
import * as path from 'path';
import * as libCoverage from 'istanbul-lib-coverage';
import * as libReport from 'istanbul-lib-report';
import * as reports from 'istanbul-reports';
import type { CoverageMapData, FileCoverageData, Range as IstanbulRange } from 'istanbul-lib-coverage';
// lcov-parse ships no type declarations
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const lcovParse = require('lcov-parse');

/**
 * Renders an lcov.info file (as captured from the rooibos framework) into an
 * Istanbul-style HTML coverage report - the same nyc look TS projects get.
 *
 * The framework extends plain lcov with two custom line types, extracted here before
 * parsing (standard lcov consumers ignore them because we strip them out first):
 *  - `RBSCOL:<block>,<branch>,<startCol>,<endCol>` - column data for expression-level
 *    branches (ternary arms etc.) so missed arms get the yellow cbranch-no wrap.
 *  - `RBSSPAN:<startLine>,<endLine>` - a multi-line simple statement anchored at
 *    startLine, so the whole statement paints red/covered like nyc paints multi-line
 *    TS statements.
 */

export interface LcovExtensions {
    /** `<file>:<blockId>:<branchId>` -> arm columns (0-indexed, inclusive end) */
    branchColumns: Map<string, { startColumn: number; endColumn: number }>;
    /** `<file>:<startLine>` -> end line of a multi-line statement */
    statementSpans: Map<string, number>;
    /** the lcov text with the extension lines removed */
    cleanLcov: string;
}

interface LcovLineDetail {
    line: number;
    hit: number;
}
interface LcovFunctionDetail {
    line: number;
    hit?: number;
    name: string;
}
interface LcovBranchDetail {
    line: number;
    block: number;
    branch: number;
    taken?: number;
}
export interface LcovFileRecord {
    file: string;
    lines: { details?: LcovLineDetail[] };
    functions: { details?: LcovFunctionDetail[] };
    branches: { details?: LcovBranchDetail[] };
}

/** Reads a source file's lines lazily; shared so column lookups don't re-read files. */
export class SourceCache {
    private cache = new Map<string, string[]>();

    public getLines(filePath: string): string[] {
        let lines = this.cache.get(filePath);
        if (!lines) {
            try {
                lines = fs.readFileSync(filePath, 'utf8').split('\n');
            } catch {
                lines = [];
            }
            this.cache.set(filePath, lines);
        }
        return lines;
    }

    /** Column of the first non-whitespace character, so badges land inline with the code. */
    public getIndentColumn(filePath: string, lineNumber: number): number {
        const line = this.getLines(filePath)[lineNumber - 1];
        if (!line) {
            return 0;
        }
        const match = /^\s*/.exec(line);
        return match ? match[0].length : 0;
    }

    /**
     * Column of the `function`/`sub` keyword on a declaration line so the missed-function
     * highlight wraps just the signature rather than any `handler = ` prefix.
     */
    public getKeywordColumn(filePath: string, lineNumber: number): number {
        const line = this.getLines(filePath)[lineNumber - 1];
        if (!line) {
            return 0;
        }
        const keyword = /\b(function|sub)\b/i.exec(line);
        if (keyword) {
            return keyword.index;
        }
        const indent = /^\s*/.exec(line);
        return indent ? indent[0].length : 0;
    }
}

/**
 * Splits the framework's custom extension lines out of raw lcov text. Also collapses
 * modern 3-arg `FN:start,end,name` rows to the 2-arg form lcov-parse understands, and
 * strips CR from console-captured CRLF output.
 */
export function extractLcovExtensions(rawText: string): LcovExtensions {
    const withCollapsedFn = rawText.replace(/^FN:(\d+),\d+,(.+)$/gm, 'FN:$1,$2');
    const branchColumns = new Map<string, { startColumn: number; endColumn: number }>();
    const statementSpans = new Map<string, number>();
    const cleanLines: string[] = [];
    let currentSf: string | null = null;

    for (let line of withCollapsedFn.split('\n')) {
        line = line.replace(/\r$/, '');
        const sfMatch = /^SF:(.+)$/.exec(line);
        if (sfMatch) {
            currentSf = sfMatch[1];
        }
        const colMatch = /^RBSCOL:(\d+),(\d+),(\d+),(\d+)$/.exec(line);
        if (colMatch && currentSf) {
            branchColumns.set(`${currentSf}:${colMatch[1]}:${colMatch[2]}`, {
                startColumn: Number(colMatch[3]),
                endColumn: Number(colMatch[4])
            });
            continue;
        }
        const spanMatch = /^RBSSPAN:(\d+),(\d+)$/.exec(line);
        if (spanMatch && currentSf) {
            statementSpans.set(`${currentSf}:${spanMatch[1]}`, Number(spanMatch[2]));
            continue;
        }
        cleanLines.push(line);
    }
    return { branchColumns: branchColumns, statementSpans: statementSpans, cleanLcov: cleanLines.join('\n') };
}

function lineSpan(line: number): IstanbulRange {
    // Statements span a whole line so Istanbul's HTML annotator paints the entire line
    // red on miss instead of just marking the gutter.
    return { start: { line: line, column: 0 }, end: { line: line, column: 1024 } };
}

function pointAt(line: number, column: number): IstanbulRange {
    return { start: { line: line, column: column }, end: { line: line, column: column } };
}

/**
 * Builds one Istanbul FileCoverage from an lcov record plus the extension data. Pure
 * transform (aside from source reads for badge columns) - unit-testable without
 * rendering anything.
 */
export function buildFileCoverage(record: LcovFileRecord, resolvedPath: string, extensions: LcovExtensions, sourceCache: SourceCache): FileCoverageData {
    const fileCoverage: FileCoverageData = {
        path: resolvedPath,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: {}
    };

    const lineDetails = record.lines.details ?? [];
    const daLines = new Set(lineDetails.map((line) => line.line));
    let statementIndex = 0;
    for (const line of lineDetails) {
        fileCoverage.statementMap[statementIndex] = lineSpan(line.line);
        fileCoverage.s[statementIndex] = line.hit;
        statementIndex++;
        // Istanbul's HTML annotator only paints the FIRST line of a multi-line statement
        // (it clamps endCol to the first line's length), and full-line red/green comes
        // from per-line coverage classes which only exist for DA lines. So expand each
        // RBSSPAN into synthetic single-line statements carrying the anchor's hit count.
        // Lines with their own DA entry keep their own counts.
        const spanEnd = extensions.statementSpans.get(`${record.file}:${line.line}`);
        if (spanEnd) {
            for (let continuation = line.line + 1; continuation <= spanEnd; continuation++) {
                if (daLines.has(continuation)) {
                    continue;
                }
                fileCoverage.statementMap[statementIndex] = lineSpan(continuation);
                fileCoverage.s[statementIndex] = line.hit;
                statementIndex++;
            }
        }
    }

    (record.functions.details ?? []).forEach((fn, index) => {
        const declColumn = sourceCache.getKeywordColumn(resolvedPath, fn.line);
        const decl: IstanbulRange = {
            start: { line: fn.line, column: declColumn },
            end: { line: fn.line, column: 1024 }
        };
        fileCoverage.fnMap[index] = { name: fn.name, decl: decl, loc: decl, line: fn.line };
        fileCoverage.f[index] = fn.hit ?? 0;
    });

    // Group branches by `block` so paired then/else (and other multi-arm decisions)
    // become a single Istanbul branch entry with multiple locations - this is what
    // produces the I/E badges in the HTML report when one outcome is missed.
    const branchesByBlock = new Map<number, LcovBranchDetail[]>();
    for (const branch of record.branches.details ?? []) {
        const list = branchesByBlock.get(branch.block) ?? [];
        list.push(branch);
        branchesByBlock.set(branch.block, list);
    }

    let branchIndex = 0;
    for (const [blockId, branches] of branchesByBlock.entries()) {
        branches.sort((a, b) => a.branch - b.branch);
        const earliestLine = Math.min(...branches.map(b => b.line));
        const columnKey = (branchId: number) => `${record.file}:${blockId}:${branchId}`;

        // RBSCOL data means the framework recorded start/end columns for the arms
        // (expression-level branches like ternary arms); switch to type 'cond-expr' so
        // Istanbul's annotator wraps each missed arm with cbranch-no (yellow highlight)
        // instead of inserting an I/E badge. Block-level branches (no column data) keep
        // type 'if' for the badge - the wrap path's snap-to-whitespace logic mis-handles
        // full-line wraps.
        const hasColumnData = branches.every(b => extensions.branchColumns.has(columnKey(b.branch)));
        const locations = branches.map(b => {
            const columns = extensions.branchColumns.get(columnKey(b.branch));
            if (columns) {
                return {
                    start: { line: b.line, column: columns.startColumn },
                    end: { line: b.line, column: columns.endColumn }
                };
            }
            return pointAt(b.line, sourceCache.getIndentColumn(resolvedPath, b.line));
        });

        fileCoverage.branchMap[branchIndex] = {
            type: hasColumnData ? 'cond-expr' : 'if',
            line: earliestLine,
            loc: pointAt(earliestLine, sourceCache.getIndentColumn(resolvedPath, earliestLine)),
            locations: locations
        };
        fileCoverage.b[branchIndex] = branches.map(b => b.taken ?? 0);
        branchIndex++;
    }

    return fileCoverage;
}

/**
 * Post-render page fixups:
 *  - Istanbul hardcodes `prettyprint lang-js` on the source <pre>; the JS tokenizer
 *    mangles BrightScript (notably recoloring the I/E badges), so strip it and render
 *    plain monospace.
 *  - Loop-body branches are a rooibos extra (nyc doesn't track loop entry at all), but
 *    they ride through Istanbul as type 'if', whose badge title is hardcoded to
 *    "if path not taken". Retitle badges that sit on loop lines.
 */
export function fixupReportHtml(html: string): string {
    let fixed = html.replace(/<pre class="prettyprint lang-js">/g, '<pre>');
    if (fixed.includes('title="if path not taken"')) {
        fixed = fixed
            .split('\n')
            .map((htmlLine) => {
                if (!htmlLine.includes('title="if path not taken"')) {
                    return htmlLine;
                }
                const sourceText = htmlLine
                    .replace(/<span[^>]*title="if path not taken"[^>]*>I<\/span>/g, '')
                    .replace(/<[^>]*>/g, '');
                if (/^\s*(for|while)\b/i.test(sourceText)) {
                    return htmlLine.replace(/title="if path not taken"/g, 'title="loop body never entered"');
                }
                return htmlLine;
            })
            .join('\n');
    }
    return fixed;
}

function fixupHtmlFiles(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            fixupHtmlFiles(full);
        } else if (entry.name.endsWith('.html')) {
            const original = fs.readFileSync(full, 'utf8');
            const fixed = fixupReportHtml(original);
            if (fixed !== original) {
                fs.writeFileSync(full, fixed);
            }
        }
    }
}

function parseLcov(text: string): Promise<LcovFileRecord[]> {
    return new Promise((resolve, reject) => {
        lcovParse.source(text, (err: Error | null, data: LcovFileRecord[]) => {
            if (err) {
                reject(err instanceof Error ? err : new Error(String(err)));
            } else {
                resolve(data);
            }
        });
    });
}

export interface HtmlReportOptions {
    /** Path to the captured lcov.info */
    lcovPath: string;
    /** Directory to write the HTML report into */
    outputDir: string;
    /** Root used to resolve relative SF: paths from the lcov (default: cwd) */
    sourceRoot?: string;
}

export async function generateHtmlReport(options: HtmlReportOptions): Promise<void> {
    const lcovPath = path.resolve(options.lcovPath);
    const outputDir = path.resolve(options.outputDir);
    const sourceRoot = path.resolve(options.sourceRoot ?? process.cwd());

    const extensions = extractLcovExtensions(fs.readFileSync(lcovPath, 'utf8'));
    const records = await parseLcov(extensions.cleanLcov);

    const sourceCache = new SourceCache();
    const coverageData: CoverageMapData = {};
    for (const record of records) {
        const resolvedPath = path.isAbsolute(record.file) ? record.file : path.resolve(sourceRoot, record.file);
        coverageData[resolvedPath] = buildFileCoverage(record, resolvedPath, extensions, sourceCache);
    }
    const coverageMap = libCoverage.createCoverageMap(coverageData);

    const context = libReport.createContext({
        dir: outputDir,
        coverageMap: coverageMap,
        defaultSummarizer: 'nested'
    });
    reports.create('html').execute(context);
    reports.create('text-summary').execute(context);
    fixupHtmlFiles(outputDir);

    console.log(`\n[rooibos] HTML coverage report written to ${outputDir}`);
}
