#!/usr/bin/env node
// Thin wrapper kept for npm scripts and direct invocation - the logic lives in
// src/lib/rooibos/CoverageHtmlGenerator.ts (also reachable via the rooibos CLI's
// --coverage-html flag). Requires `npm run build` first.
//
// Usage: node scripts/lcov-to-html.js <lcov.info> <output-dir> [source-root]

const [, , lcovPath, outputDir, sourceRoot] = process.argv;

if (!lcovPath || !outputDir) {
    console.error('Usage: node scripts/lcov-to-html.js <lcov.info> <output-dir> [source-root]');
    process.exit(1);
}

const { generateHtmlReport } = require('../dist/lib/rooibos/CoverageHtmlGenerator');

generateHtmlReport({ lcovPath, outputDir, sourceRoot }).catch((e) => {
    console.error(e);
    process.exit(1);
});
