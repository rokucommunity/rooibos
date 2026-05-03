#!/usr/bin/env node
/* eslint-disable */
// Convert an lcov.info file into an Istanbul-style HTML coverage report.
// Reuses the istanbul packages already pulled in transitively by nyc, so no
// new dependencies are required.
//
// Usage: node scripts/lcov-to-html.js <lcov.info> <output-dir>

const fs = require('fs');
const path = require('path');
const lcovParse = require('lcov-parse');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const [, , lcovPathArg, outputDirArg, sourceRootArg] = process.argv;

if (!lcovPathArg || !outputDirArg) {
    console.error('Usage: node scripts/lcov-to-html.js <lcov.info> <output-dir> [source-root]');
    process.exit(1);
}

const lcovPath = path.resolve(lcovPathArg);
const outputDir = path.resolve(outputDirArg);
// Used to resolve relative SF: paths from the lcov file. Roku's framework writes paths
// like `./source/foo.bs`; without a base, Istanbul's HTML reporter can't locate the source.
const sourceRoot = path.resolve(sourceRootArg || process.cwd());

// The Rooibos framework emits FN lines as `FN:start,end,name` (modern LCOV spec).
// lcov-parse only understands the older `FN:line,name` form, so collapse 3-arg FN
// rows to 2-arg before parsing.
const rawWithExtensions = fs.readFileSync(lcovPath, 'utf8').replace(/^FN:(\d+),\d+,(.+)$/gm, 'FN:$1,$2');

// Extract our custom RBSCOL extension lines (column data for expression-level branches like
// ternary arms) and strip them out so lcov-parse doesn't choke. Keyed by `<file>:<block>:<branch>`
// since records are per-file and we walk SF: in order.
// Maps `<file>:<block>:<branch>` -> { startColumn, endColumn } for expression-level branches.
// When present, the renderer treats the branch as a wrap target (type !== 'if') so Istanbul's
// annotator paints the missed arm yellow via the cbranch-no class.
const branchColumns = new Map();
let raw = '';
let currentSf = null;
for (let line of rawWithExtensions.split('\n')) {
    // The lcov can be captured from device console output that uses CRLF line endings; strip
    // the trailing CR so our anchors match.
    line = line.replace(/\r$/, '');
    const sfMatch = line.match(/^SF:(.+)$/);
    if (sfMatch) {
        currentSf = sfMatch[1];
    }
    const colMatch = line.match(/^RBSCOL:(\d+),(\d+),(\d+),(\d+)$/);
    if (colMatch && currentSf) {
        const [, blockId, branchId, startCol, endCol] = colMatch;
        branchColumns.set(`${currentSf}:${blockId}:${branchId}`, {
            startColumn: Number(startCol),
            endColumn: Number(endCol)
        });
        continue;
    }
    raw += line + '\n';
}

lcovParse.source(raw, (err, data) => {
    if (err) {
        console.error(`Failed to parse ${lcovPath}:`, err);
        process.exit(1);
    }

    const coverageMap = libCoverage.createCoverageMap();
    // Cache of source lines so we can compute the first-non-whitespace column for each branch
    // line. Without this the I/E badges land at column 0 (before indentation) instead of inline
    // with the source statement, like nyc's TS report.
    const sourceLineCache = new Map();
    function getIndentColumn(filePath, lineNumber) {
        let lines = sourceLineCache.get(filePath);
        if (!lines) {
            try {
                lines = fs.readFileSync(filePath, 'utf8').split('\n');
            } catch {
                lines = [];
            }
            sourceLineCache.set(filePath, lines);
        }
        const line = lines[lineNumber - 1];
        if (!line) {
            return 0;
        }
        const match = line.match(/^\s*/);
        return match ? match[0].length : 0;
    }
    const pointAt = (line, column = 0) => ({ start: { line, column }, end: { line, column } });
    // Statements span a whole line so Istanbul's HTML annotator paints the entire line red on
    // miss instead of just marking the gutter.
    const lineSpan = (line) => ({ start: { line, column: 0 }, end: { line, column: 1024 } });

    for (const file of data) {
        const resolvedPath = path.isAbsolute(file.file) ? file.file : path.resolve(sourceRoot, file.file);
        const fileCoverage = {
            path: resolvedPath,
            statementMap: {},
            fnMap: {},
            branchMap: {},
            s: {},
            f: {},
            b: {}
        };

        (file.lines.details || []).forEach((line, i) => {
            fileCoverage.statementMap[i] = lineSpan(line.line);
            fileCoverage.s[i] = line.hit;
        });

        (file.functions.details || []).forEach((fn, i) => {
            fileCoverage.fnMap[i] = {
                name: fn.name,
                decl: lineSpan(fn.line),
                loc: lineSpan(fn.line)
            };
            fileCoverage.f[i] = fn.hit || 0;
        });

        // Group branches by `block` so paired then/else (and other multi-arm decisions) become
        // a single Istanbul branch entry with multiple locations - this is what produces the
        // I/E badges in the HTML report when one outcome is missed.
        const branchesByBlock = new Map();
        for (const br of (file.branches.details || [])) {
            if (!branchesByBlock.has(br.block)) {
                branchesByBlock.set(br.block, []);
            }
            branchesByBlock.get(br.block).push(br);
        }

        let bIdx = 0;
        for (const [blockId, branches] of branchesByBlock.entries()) {
            branches.sort((a, b) => a.branch - b.branch);
            const earliestLine = Math.min(...branches.map(b => b.line));
            const colKey = (branchId) => `${file.file}:${blockId}:${branchId}`;

            // Detect whether this is an expression-level branch (ternary etc.). RBSCOL data
            // means the framework recorded both start and end columns for the arms; switch to
            // type:'cond-expr' so Istanbul's annotator wraps each missed arm with cbranch-no
            // (the yellow !important highlight) instead of inserting an I/E badge. Block-level
            // branches (no column data) keep type:'if' for the badge - the wrap path's
            // snap-to-whitespace logic mis-handles full-line wraps.
            const hasColumnData = branches.every(b => branchColumns.has(colKey(b.branch)));
            const locations = branches.map(b => {
                const cols = branchColumns.get(colKey(b.branch));
                if (cols) {
                    return {
                        start: { line: b.line, column: cols.startColumn },
                        end: { line: b.line, column: cols.endColumn }
                    };
                }
                const indent = getIndentColumn(resolvedPath, b.line);
                return pointAt(b.line, indent);
            });

            fileCoverage.branchMap[bIdx] = {
                type: hasColumnData ? 'cond-expr' : 'if',
                line: earliestLine,
                loc: pointAt(earliestLine, getIndentColumn(resolvedPath, earliestLine)),
                locations
            };
            fileCoverage.b[bIdx] = branches.map(b => b.taken || 0);
            bIdx++;
        }

        coverageMap.addFileCoverage(fileCoverage);
    }

    const context = libReport.createContext({
        dir: outputDir,
        coverageMap,
        defaultSummarizer: 'nested'
    });

    reports.create('html').execute(context);
    reports.create('text-summary').execute(context);

    // Istanbul hardcodes `prettyprint lang-js` on the source <pre>. For BrightScript the JS
    // tokenizer assigns weird classes (notably wrapping the I/E badge text in a .pln span,
    // which sets color:#000 and overrides the badge's yellow). Strip the lang and prettyprint
    // class on every generated source page so the source renders as plain monospace text and
    // the badge keeps its yellow color.
    const fixupHtml = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                fixupHtml(full);
            } else if (entry.name.endsWith('.html')) {
                const original = fs.readFileSync(full, 'utf8');
                const fixed = original.replace(/<pre class="prettyprint lang-js">/g, '<pre>');
                if (fixed !== original) {
                    fs.writeFileSync(full, fixed);
                }
            }
        }
    };
    fixupHtml(outputDir);

    console.log(`[rooibos] HTML coverage report written to ${outputDir}`);
});
