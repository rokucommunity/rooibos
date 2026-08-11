import * as fs from 'fs';
import * as path from 'path';
import * as libCoverage from 'istanbul-lib-coverage';
import * as libReport from 'istanbul-lib-report';
import * as reports from 'istanbul-reports';
import { spawnSync } from 'child_process';
import type { CoverageMapData, FileCoverageData, Range as IstanbulRange } from 'istanbul-lib-coverage';
import type { CoverageMap as CoverageMapJson } from './CodeCoverageProcessor';
// lcov-parse ships no type declarations
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
const lcovParse = require('lcov-parse');

/**
 * Turns the raw coverage text captured from the rooibos framework into host-side report
 * artifacts. Mirrors nyc's architecture: the canonical rich format is an Istanbul coverage
 * map (ranges with columns), everything else is an export of it.
 *
 *  - `coverage-final.json` - the canonical Istanbul JSON, full fidelity (multi-line
 *    statement ranges, branch arm columns). Consumable by the whole istanbul ecosystem
 *    (nyc report, VSCode gutters, merge tooling).
 *  - `lcov.info` - strictly-standard lossy export written by istanbul's own `lcovonly`
 *    reporter (2-arg FN rows, no vendor extensions). Safe for Coveralls, genhtml, or any
 *    strict lcov parser. SF paths are repo-relative when the build-time path map is
 *    available.
 *  - HTML report - stock istanbul rendering of the canonical map, zero post-processing;
 *    the pages are exactly what nyc produces for a TS project. (Prettify highlights the
 *    BrightScript with its JS lexer - imperfect but accepted; a lang-bs.js prettify
 *    extension is the future path to proper highlighting.)
 *
 * The wire format from the device is deliberately plain lcov text - rich detail
 * (statement spans, branch arm columns) lives in the static CodeCoverage.json model and
 * flows through the condensed-counts channel when `coverageReporter` is set; this legacy
 * lcov path renders with line/indent anchors only.
 */

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
 * Normalizes console-captured lcov text for lcov-parse: collapses modern 3-arg
 * `FN:start,end,name` rows to the 2-arg form it understands, and strips CR from
 * CRLF output.
 */
export function normalizeLcovText(rawText: string): string {
    return rawText
        .replace(/^FN:(\d+),\d+,(.+)$/gm, 'FN:$1,$2')
        .replace(/\r/g, '');
}

/** pkg-relative `sourceFile` -> repo-relative `sourcePath`, recorded at build time. */
export type CoveragePathMap = Map<string, string>;

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

/**
 * Derives the pkg-path -> repo-path map from the coverage model. Returns undefined when
 * the model is absent or predates the `sourcePath` field - consumers then fall back to
 * resolving the device's pkg-relative SF paths directly.
 */
export function loadCoveragePathMap(codeCoverageJsonPath: string): CoveragePathMap | undefined {
    const model = loadCoverageModel(codeCoverageJsonPath);
    const map = new Map<string, string>();
    for (const file of model?.files ?? []) {
        if (file?.sourceFile && file.sourcePath) {
            map.set(file.sourceFile, file.sourcePath);
        }
    }
    return map.size > 0 ? map : undefined;
}

function pointAt(line: number, column: number): IstanbulRange {
    return { start: { line: line, column: column }, end: { line: line, column: column } };
}

/**
 * Builds one canonical Istanbul FileCoverage from an lcov record. Statements and branch
 * arms anchor by line/indent - the lcov wire carries no column or span detail (that
 * fidelity comes via the condensed-counts channel and the static model instead). Pure
 * transform (aside from source reads for badge columns) - unit-testable without
 * rendering anything.
 */
export function buildFileCoverage(record: LcovFileRecord, resolvedPath: string, sourceCache: SourceCache): FileCoverageData {
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
    let statementIndex = 0;
    for (const line of lineDetails) {
        fileCoverage.statementMap[statementIndex] = {
            start: { line: line.line, column: 0 },
            end: { line: line.line, column: 1024 }
        };
        fileCoverage.s[statementIndex] = line.hit;
        statementIndex++;
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
    for (const branches of branchesByBlock.values()) {
        branches.sort((a, b) => a.branch - b.branch);
        const earliestLine = Math.min(...branches.map(b => b.line));
        // The lcov wire has no arm columns, so every decision renders as type 'if' with
        // I/E badges at line/indent anchors (the cond-expr yellow-wrap treatment needs
        // the column detail that only the counts channel carries).
        const locations = branches.map(b => pointAt(b.line, sourceCache.getIndentColumn(resolvedPath, b.line)));

        fileCoverage.branchMap[branchIndex] = {
            type: 'if',
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
        const fileCoverage: FileCoverageData = {
            path: resolvedPath,
            statementMap: {},
            fnMap: {},
            branchMap: {},
            s: {},
            f: {},
            b: {}
        };

        const lineHitByNumber = new Map<number, number>();
        let statementIndex = 0;
        file.lines.forEach((line, index) => {
            const hit = Number(fileCounts?.l?.[index] ?? 0);
            lineHitByNumber.set(line.lineNumber, hit);
            fileCoverage.statementMap[index] = {
                start: { line: line.lineNumber, column: 0 },
                end: { line: line.el ?? line.lineNumber, column: 1024 }
            };
            fileCoverage.s[index] = hit;
            statementIndex = index + 1;
        });

        file.functions.forEach((fn, index) => {
            const declColumn = sourceCache.getKeywordColumn(resolvedPath, fn.startLine);
            const decl: IstanbulRange = {
                start: { line: fn.startLine, column: declColumn },
                end: { line: fn.startLine, column: 1024 }
            };
            fileCoverage.fnMap[index] = { name: fn.name, decl: decl, loc: decl, line: fn.startLine };
            fileCoverage.f[index] = Number(fileCounts?.f?.[index] ?? 0);
        });

        file.blocks.forEach((block, blockIndex) => {
            if (!block.branches?.length) {
                return;
            }
            const armHits = fileCounts?.b?.[blockIndex] ?? [];
            const hits = block.branches.map((branch, armIndex) => Number(armHits[armIndex] ?? 0));
            const earliestLine = Math.min(...block.branches.map(b => b.line));
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

            fileCoverage.branchMap[blockIndex] = {
                type: hasColumnData ? 'cond-expr' : 'if',
                line: earliestLine,
                loc: pointAt(earliestLine, sourceCache.getIndentColumn(resolvedPath, earliestLine)),
                locations: locations
            };
            fileCoverage.b[blockIndex] = hits;

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

export interface CoverageReportOptions {
    /** Raw lcov text captured from the device console */
    rawLcov: string;
    /** Path to write the strictly-standard lcov.info. Skipped when undefined. */
    lcovPath?: string;
    /** Path to write the canonical Istanbul coverage-final.json. Skipped when undefined. */
    istanbulJsonPath?: string;
    /** Directory to render the HTML report into. Skipped when undefined. */
    htmlDir?: string;
    /**
     * Repository root of the app under test (default: cwd). lcov SF paths are emitted
     * relative to it and source files are resolved beneath it.
     */
    sourceRoot?: string;
    /** Build-time pkg-path -> repo-path map (see {@link loadCoveragePathMap}) */
    pathMap?: CoveragePathMap;
}

/**
 * Parses the captured device output once into a canonical Istanbul coverage map, then
 * writes whichever artifacts were requested (see the module doc for what each one is).
 */
export async function writeCoverageReports(options: CoverageReportOptions): Promise<void> {
    const sourceRoot = path.resolve(options.sourceRoot ?? process.cwd());

    const records = await parseLcov(normalizeLcovText(options.rawLcov));

    const sourceCache = new SourceCache();
    const coverageData: CoverageMapData = {};
    for (const record of records) {
        // Prefer the build-time repo-relative path; fall back to treating the device's SF
        // path (pkg-relative `./components/...`) as sourceRoot-relative.
        const relativePath = options.pathMap?.get(record.file) ?? record.file;
        const resolvedPath = path.isAbsolute(relativePath) ? relativePath : path.resolve(sourceRoot, relativePath);
        coverageData[resolvedPath] = buildFileCoverage(record, resolvedPath, sourceCache);
    }

    emitIstanbulJson(coverageData, options.istanbulJsonPath);
    emitLcov(coverageData, options.lcovPath, sourceRoot);
    emitHtml(coverageData, options.htmlDir);
}

function emitIstanbulJson(coverageData: CoverageMapData, outputPath: string | undefined) {
    if (!outputPath) {
        return;
    }
    const istanbulJsonPath = path.resolve(outputPath);
    fs.mkdirSync(path.dirname(istanbulJsonPath), { recursive: true });
    fs.writeFileSync(istanbulJsonPath, JSON.stringify(coverageData));
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
    /** Which reporter the user configured (rooibos config `coverageReporter`) */
    reporter: 'lcov' | 'nyc';
    /** Path for the lcov.info (basename respected in both modes) */
    lcovPath?: string;
    /** Path for the canonical Istanbul coverage-final.json */
    istanbulJsonPath?: string;
    /** Directory for the rooibos-rendered HTML report (optional in both modes) */
    htmlDir?: string;
    /** Repository root of the app under test (default: cwd) */
    sourceRoot?: string;
}

/**
 * Builds the canonical Istanbul map from the static model + condensed device counts,
 * then reports per the user's `coverageReporter` setting:
 *  - 'lcov': same artifacts as the lcov capture path (strict lcov.info,
 *    coverage-final.json, optional HTML).
 *  - 'nyc': writes coverage-final.json and runs `nyc report` over it with the lcov and
 *    text-summary reporters - nyc's lcov reporter also produces an lcov.info and an
 *    lcov-report/ HTML directory as part of its output.
 */
export async function writeCoverageReportsFromCounts(options: CountsReportOptions): Promise<void> {
    const sourceRoot = path.resolve(options.sourceRoot ?? process.cwd());
    const counts = parseCoverageCounts(options.rawCounts);
    const coverageData = buildCoverageDataFromModel(options.model, counts, sourceRoot);

    emitIstanbulJson(coverageData, options.istanbulJsonPath);

    if (options.reporter === 'nyc') {
        runNycReport(options, coverageData, sourceRoot);
    } else {
        emitLcov(coverageData, options.lcovPath, sourceRoot);
    }
    emitHtml(coverageData, options.htmlDir);
    return Promise.resolve();
}

/**
 * Runs `nyc report` over the emitted coverage-final.json. nyc's temp dir is the folder
 * holding the JSON; its report dir is the lcov target's folder. `--exclude-after-remap`
 * must be off or nyc's post-remap filter silently drops non-JS extensions (.bs/.brs).
 */
function runNycReport(options: CountsReportOptions, coverageData: CoverageMapData, sourceRoot: string) {
    const istanbulJsonPath = path.resolve(options.istanbulJsonPath ?? 'coverage/coverage-final.json');
    const reportDir = path.dirname(path.resolve(options.lcovPath ?? istanbulJsonPath));
    let nycBin: string;
    try {
        nycBin = require.resolve('nyc/bin/nyc.js');
    } catch {
        console.error('[rooibos] nyc is not installed; falling back to the built-in lcov writer');
        emitLcov(coverageData, options.lcovPath, sourceRoot);
        return;
    }
    const args = [
        nycBin, 'report',
        '--temp-dir', path.dirname(istanbulJsonPath),
        '--report-dir', reportDir,
        '--reporter=lcov',
        '--reporter=text-summary',
        '--exclude-after-remap=false',
        '--cwd', sourceRoot
    ];
    console.log(`[rooibos] running nyc report (reporters: lcov, text-summary) into ${reportDir}`);
    const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
    if (result.status !== 0) {
        console.error(`[rooibos] nyc report exited with ${result.status}; falling back to the built-in lcov writer`);
        emitLcov(coverageData, options.lcovPath, sourceRoot);
        return;
    }
    // nyc hardcodes the file name lcov.info inside its report dir; honor a custom
    // --coverage-output basename by renaming.
    if (options.lcovPath) {
        const requested = path.resolve(options.lcovPath);
        const nycLcov = path.join(reportDir, 'lcov.info');
        if (requested !== nycLcov && fs.existsSync(nycLcov)) {
            fs.renameSync(nycLcov, requested);
        }
        console.log(`[rooibos] wrote lcov to ${fs.existsSync(requested) ? requested : nycLcov}`);
    }
    const lcovReportDir = path.join(reportDir, 'lcov-report');
    if (fs.existsSync(lcovReportDir)) {
        console.log(`[rooibos] nyc HTML report written to ${lcovReportDir}`);
    }
}

