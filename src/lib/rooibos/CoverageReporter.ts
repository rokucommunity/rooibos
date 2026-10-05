import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as libCoverage from 'istanbul-lib-coverage';
import * as libReport from 'istanbul-lib-report';
import * as reports from 'istanbul-reports';
import type { CoverageMapData, FileCoverageData, Range as IstanbulRange } from 'istanbul-lib-coverage';
import type { CoverageMap as CoverageMapJson } from './CodeCoverageProcessor';

/**
 * Turns the condensed hit-counts stream captured from the rooibos framework into host-side
 * report artifacts. The canonical rich format is an Istanbul coverage map (ranges with
 * columns), everything else is an export of it.
 *
 *  - `coverage-final.json` - the canonical Istanbul JSON, full fidelity (multi-line
 *    statement ranges, branch arm columns). Consumable by the whole istanbul ecosystem
 *    (nyc report, VSCode gutters, merge tooling).
 *  - `lcov.info` - strictly-standard lossy export written by istanbul's own `lcovonly`
 *    reporter (2-arg FN rows, no vendor extensions). Safe for Coveralls, genhtml, or any
 *    strict lcov parser.
 *  - HTML report - stock istanbul rendering of the canonical map, zero post-processing;
 *    the pages are exactly what nyc produces for a TS project. (Prettify highlights the
 *    BrightScript with its JS lexer - imperfect but accepted; a lang-bs.js prettify
 *    extension is the future path to proper highlighting.)
 *
 * Rich detail (statement spans, branch arm columns) lives in the static
 * CodeCoverage.json model and flows through the condensed-counts channel, which is always
 * emitted when `codeCoverage` is on.
 */

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
 * Loads the static coverage model the bsc plugin wrote into
 * `components/rooibos/CodeCoverage.json` (the same file the device parses at runtime).
 * Returns undefined when the file is missing or unparseable.
 */
export function loadCoverageModel(codeCoverageJsonPath: string): CoverageMapJson | undefined {
    try {
        const parsed = JSON.parse(fs.readFileSync(codeCoverageJsonPath, 'utf8')) as CoverageMapJson;
        return Array.isArray(parsed?.files) ? parsed : undefined;
    } catch {
        return undefined;
    }
}

function pointAt(line: number, column: number): IstanbulRange {
    return { start: { line: line, column: column }, end: { line: line, column: column } };
}

/** Sentinel end column for whole-line ranges - istanbul clamps it to the actual line length. */
const END_OF_LINE_COLUMN = 1024;

function emptyFileCoverage(resolvedPath: string): FileCoverageData {
    return {
        path: resolvedPath,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: {}
    };
}

/** Whole-line (or line-span) statement entry. */
function addStatementEntry(fileCoverage: FileCoverageData, index: number, startLine: number, endLine: number, hit: number) {
    fileCoverage.statementMap[index] = {
        start: { line: startLine, column: 0 },
        end: { line: endLine, column: END_OF_LINE_COLUMN }
    };
    fileCoverage.s[index] = hit;
}

/**
 * Declaration-line function entry: the decl starts at the function/sub keyword so the
 * missed-function highlight wraps just the signature, not any `handler = ` prefix.
 */
function addFunctionEntry(fileCoverage: FileCoverageData, index: number, name: string, line: number, hit: number, resolvedPath: string, sourceCache: SourceCache) {
    const declColumn = sourceCache.getKeywordColumn(resolvedPath, line);
    const decl: IstanbulRange = {
        start: { line: line, column: declColumn },
        end: { line: line, column: END_OF_LINE_COLUMN }
    };
    fileCoverage.fnMap[index] = { name: name, decl: decl, loc: decl, line: line };
    fileCoverage.f[index] = hit;
}

/**
 * One grouped decision entry (a block's arms as a single Istanbul branch). Anchors the
 * I/E badge to the earliest arm line at its indent column.
 */
function addBranchEntry(fileCoverage: FileCoverageData, index: number, type: 'if' | 'cond-expr', armLines: number[], locations: IstanbulRange[], hits: number[], resolvedPath: string, sourceCache: SourceCache) {
    const earliestLine = Math.min(...armLines);
    fileCoverage.branchMap[index] = {
        type: type,
        line: earliestLine,
        loc: pointAt(earliestLine, sourceCache.getIndentColumn(resolvedPath, earliestLine)),
        locations: locations
    };
    fileCoverage.b[index] = hits;
}

/**
 * One file's sparse hit counts from the device's condensed console stream. Every key is
 * an INDEX into the corresponding array of the static coverage model
 * (components/rooibos/CodeCoverage.json); missing keys mean zero hits.
 */
export interface CondensedFileCounts {
    /** file index into model.files */
    i: number;
    /** line index -> hit count */
    l?: Record<string, number>;
    /** function index -> hit count */
    f?: Record<string, number>;
    /** block index -> hit count per arm (aligned with block.branches) */
    b?: Record<string, number[]>;
}

/** model file index -> that file's counts. Files with no hits are absent entirely. */
export type CondensedCounts = Map<number, CondensedFileCounts>;

/**
 * Parses the text captured between the `+-=-coverage-counts:start/end` markers. One JSON
 * object per line; anything that isn't one (the `{"v":1}` schema header, interleaved
 * console noise) is skipped.
 */
export function parseCoverageCounts(rawText: string): CondensedCounts {
    const counts: CondensedCounts = new Map();
    for (const line of rawText.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('{')) {
            continue;
        }
        try {
            const parsed = JSON.parse(trimmed) as CondensedFileCounts;
            if (typeof parsed.i === 'number') {
                counts.set(parsed.i, parsed);
            }
        } catch {
            // partial/interleaved console line - not one of ours
        }
    }
    return counts;
}

/**
 * Builds the canonical Istanbul coverage map straight from the static model plus the
 * device's condensed counts - no lcov in between. This is the full-fidelity path: the
 * model carries statement spans (`el`), branch arm columns, and if-arm markers, so
 * nothing needs to be smuggled through the wire format.
 *
 * Includes the implicit-else synthesis that the device lcov writer performs for
 * single-arm ifs (`isIfArm` blocks with one tracked arm): the falsy path's hit count is
 * the if-line's evaluation count minus the tracked arm's hits, so never-taken else
 * paths are flagged even though the fall-through isn't directly instrumented.
 */
export function buildCoverageDataFromModel(model: CoverageMapJson, counts: CondensedCounts, sourceRoot: string, sourceCache: SourceCache = new SourceCache()): CoverageMapData {
    const data: CoverageMapData = {};
    model.files.forEach((file, fileIndex) => {
        const fileCounts = counts.get(fileIndex);
        const relativePath = file.sourcePath ?? file.sourceFile;
        const resolvedPath = path.isAbsolute(relativePath) ? relativePath : path.resolve(sourceRoot, relativePath);
        const fileCoverage = emptyFileCoverage(resolvedPath);

        const lineHitByNumber = new Map<number, number>();
        let statementIndex = 0;
        file.lines.forEach((line, index) => {
            const hit = Number(fileCounts?.l?.[index] ?? 0);
            lineHitByNumber.set(line.lineNumber, hit);
            addStatementEntry(fileCoverage, index, line.lineNumber, line.el ?? line.lineNumber, hit);
            statementIndex = index + 1;
        });

        file.functions.forEach((fn, index) => {
            addFunctionEntry(fileCoverage, index, fn.name, fn.startLine, Number(fileCounts?.f?.[index] ?? 0), resolvedPath, sourceCache);
        });

        file.blocks.forEach((block, blockIndex) => {
            if (!block.branches?.length) {
                return;
            }
            const armHits = fileCounts?.b?.[blockIndex] ?? [];
            const hits = block.branches.map((branch, armIndex) => Number(armHits[armIndex] ?? 0));
            const hasColumnData = block.branches.every(b => b.column !== undefined && b.endColumn !== undefined);
            const locations = block.branches.map(b => {
                if (b.column !== undefined && b.endColumn !== undefined) {
                    return {
                        start: { line: b.line, column: b.column },
                        end: { line: b.line, column: b.endColumn }
                    };
                }
                return pointAt(b.line, sourceCache.getIndentColumn(resolvedPath, b.line));
            });

            if (block.isIfArm && block.branches.length === 1) {
                const ifLine = block.branches[0].line;
                const evaluations = lineHitByNumber.get(ifLine) ?? 0;
                hits.push(Math.max(0, evaluations - hits[0]));
                locations.push(pointAt(ifLine, sourceCache.getIndentColumn(resolvedPath, ifLine)));
            }

            addBranchEntry(fileCoverage, blockIndex, hasColumnData ? 'cond-expr' : 'if', block.branches.map(b => b.line), locations, hits, resolvedPath, sourceCache);

            // Inline if/else arms (`if cond then <statement>`) carry their clause's column
            // range (sc/ec). Synthesize a statement per clause with the arm's hit count -
            // Istanbul's stock TS treatment of `if (x) return y;` - so a never-taken inline
            // clause paints red even though its line (the if line itself) executed.
            block.branches.forEach((arm, armIndex) => {
                if (arm.sc !== undefined && arm.ec !== undefined) {
                    fileCoverage.statementMap[statementIndex] = {
                        start: { line: arm.line, column: arm.sc },
                        end: { line: arm.line, column: arm.ec }
                    };
                    fileCoverage.s[statementIndex] = hits[armIndex];
                    statementIndex++;
                }
            });
        });

        data[resolvedPath] = fileCoverage;
    });
    return data;
}

function emitIstanbulJson(coverageData: CoverageMapData, outputPath: string | undefined) {
    if (!outputPath) {
        return;
    }
    const istanbulJsonPath = path.resolve(outputPath);
    fsExtra.outputFileSync(istanbulJsonPath, JSON.stringify(coverageData));
    console.log(`[rooibos] wrote Istanbul coverage JSON to ${istanbulJsonPath}`);
}

function emitLcov(coverageData: CoverageMapData, outputPath: string | undefined, sourceRoot: string) {
    if (!outputPath) {
        return;
    }
    const lcovPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(lcovPath), { recursive: true });
    const context = libReport.createContext({
        dir: path.dirname(lcovPath),
        coverageMap: libCoverage.createCoverageMap(coverageData)
    });
    // istanbul's own lcov writer guarantees spec compliance: 2-arg FN rows, DA derived
    // from statement anchor lines, SF relative to projectRoot (= repo-relative paths
    // that match git, which is what Coveralls joins on).
    reports.create('lcovonly', { file: path.basename(lcovPath), projectRoot: sourceRoot }).execute(context);
    // On Windows the writer emits SF paths with backslashes; lcov consumers join on
    // git's forward-slash paths, so normalize.
    const written = fs.readFileSync(lcovPath, 'utf8');
    fs.writeFileSync(lcovPath, written.replace(/^SF:(.+)$/gm, (_, sfPath: string) => `SF:${sfPath.replace(/\\/g, '/')}`));
    console.log(`[rooibos] wrote lcov to ${lcovPath}`);
}

function emitHtml(coverageData: CoverageMapData, outputDir: string | undefined) {
    if (!outputDir) {
        return;
    }
    // The canonical map renders directly - stock istanbul behavior, identical to what
    // nyc shows for TS (multi-line missed statements paint their first line only), and
    // the HTML percentages match the lcov/json numbers exactly.
    const resolvedDir = path.resolve(outputDir);
    const context = libReport.createContext({
        dir: resolvedDir,
        coverageMap: libCoverage.createCoverageMap(coverageData),
        defaultSummarizer: 'nested'
    });
    reports.create('html').execute(context);
    reports.create('text-summary').execute(context);
    console.log(`\n[rooibos] HTML coverage report written to ${resolvedDir}`);
}

export interface CountsReportOptions {
    /** Text captured between the +-=-coverage-counts markers */
    rawCounts: string;
    /** The static coverage model from components/rooibos/CodeCoverage.json */
    model: CoverageMapJson;
    /** Directory that receives lcov.info, coverage-final.json and html/. */
    outputDir: string;
}

/**
 * Builds the canonical Istanbul map from the static model + condensed device counts, then
 * unconditionally writes lcov.info, coverage-final.json and an html/ report into
 * `options.outputDir`.
 */
export async function writeCoverageReportsFromCounts(options: CountsReportOptions): Promise<void> {
    const sourceRoot = path.resolve(options.model.sourceRoot ?? process.cwd());
    const counts = parseCoverageCounts(options.rawCounts);
    const coverageData = buildCoverageDataFromModel(options.model, counts, sourceRoot);
    const outputDir = path.resolve(options.outputDir);

    emitIstanbulJson(coverageData, path.join(outputDir, 'coverage-final.json'));
    emitLcov(coverageData, path.join(outputDir, 'lcov.info'), sourceRoot);
    emitHtml(coverageData, path.join(outputDir, 'html'));
    return Promise.resolve();
}

