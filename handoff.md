# Rooibos coverage — handoff: auto-split big functions

## Where we are

Branch `feature/more-detailed-lcov` at `/Users/chris/roku/rooibos` ships an end-to-end LCOV coverage pipeline that matches nyc/Istanbul TS reports closely. Last 10 commits (newest first):

- `f6487f8` `--package` CLI flag (deploy a pre-built folder/zip, skip rooibos build)
- `9bbaf6a` brs/bs linting updates
- `3fe67e5` clear remaining lint errors in CodeCoverageProcessor.ts
- `74fa50d` CI unused-var fixes + tests for coverage/mocking interaction
- `d2f2ed5` anon function samples + tighter fstat-no wrap
- `fbb1f11` logical and/or short-circuit branch coverage
- `72ed696` null-coalescing branch coverage
- `1c44e98` ternary branch coverage with TS-style arm highlighting
- `ace05de` try/catch branch coverage
- `0a24c3b` detailed lcov (paired if/else, CLI capture, HTML viewer)

**Coverage parity with TS Istanbul:** line + function + branch coverage across if/else, single-arm if (synthetic implicit-else), try/catch, for/while/for-each bodies, ternary, `??`, and logical `and`/`or` short-circuit. Both `E`/`I` badges and the yellow `cbranch-no` arm wraps render. Anon functions and nested functions work. 129 tests passing in `src/lib/rooibos/CodeCoverageProcessor.spec.ts`.

**Open backlog item:** prettify `lang-bs.js` for BrightScript syntax highlighting on source pages (currently disabled; source renders plain monospace).

## The blocker

Tried integrating with the real prod app at `/Users/chris/roku/ukor/`. The user's workflow:
- `npm install /Users/chris/roku/rooibos` from ukor (symlink local dev version)
- Enable `isRecordingCodeCoverage: true` + `printLcov: true` in `/Users/chris/roku/ukor/launcher/bsconfig-tests.json`
- Build with `cd /Users/chris/roku/ukor/launcher && npx bsc --project bsconfig-tests.json`
- Run `npx ts-node /Users/chris/roku/rooibos/src/cli.ts --project <ukor bsconfig> --host <ip> --password <pw> --package /Users/chris/roku/ukor/dist/launcher --coverage-output /Users/chris/roku/ukor/coverage/lcov.info`

Roku rejects the sideload with `Internal limit size exceeded. (compile error &hae)` on big files. This is the per-function bytecode cap. Our instrumentation inserts one `RBS_CC_X_reportLine(N)` call per executable statement plus `reportBranch` per Block, which 2-3x's function bytecode and pushes already-large functions over the cap.

Current workaround in ukor's bsconfig (game of whack-a-mole; each deploy surfaces a new failing file):
```json
"coverageExcludedFiles": [
    "**/AWSSigner.bs",
    "**/Braze*",
    "**/braze/**/*",
    "**/components/managers/**/*",
    "**/*Service.bs",
    "**/*Service*.bs"
]
```
Files surfaced so far: `AWSSigner`, `BrazeSDK`, `AuthManager`, `ScreenManager`, `EPGService`. More to come.

## Goal for new session

**Auto-split big function bodies into helper chunks at instrumentation time** so the build never trips the Roku per-function cap. Drop the per-file exclusion list as a workaround.

Concrete shape (rough — verify before implementing):
1. In `CodeCoverageProcessor._processFile`, after the visitor walk has tagged statements with their report-call insertions and before the deferred inserts are flushed, walk each `FunctionExpression.body.statements` array and estimate post-instrumentation bytecode (cheap heuristic: count statements × ~5, count branches × ~10, etc., or just count statements with a generous fudge factor).
2. When a function body would exceed a threshold (configurable via `coverageMaxFunctionStatements` in `RooibosConfig`, default ~150-200), split its body into chunks of ~N statements each:
   - Extract each chunk to a generated function like `__<originalName>_chunk0`, `__<originalName>_chunk1`, ...
   - Replace the original body with sequential calls to the chunks: `__chunk0() : __chunk1() : ...`
3. The hard part: handle control flow that bubbles out of a chunk. `return`, `exit while`, `exit for`, `goto`, thrown exceptions. Naive splitting breaks these. Likely needs:
   - Each chunk function returns a sentinel value indicating whether the parent should keep going, return-with-value, exit-loop, etc.
   - The caller in the original function dispatches on the sentinel.
   - Or: skip splitting any function that contains complex control flow we can't handle yet, and fall back to "skip instrumentation in this function entirely" with a warning.
4. Add tests in `src/lib/rooibos/CodeCoverageProcessor.spec.ts` for split-mode output: a synthetic giant function, a function with a return inside a chunk boundary, a function with `exit for` inside a chunk, etc.
5. Verify the ukor build no longer needs any of the big-class exclusions.

The simpler escape hatch — also worth considering as a fallback — is **skip-instrument-large-functions**: when a function exceeds the threshold, leave only the `reportFunction` call (so it still appears as hit/unhit in the FN: section) and emit no line/branch instrumentation inside it. Loses per-line coverage on giant functions but is trivial to implement and would unblock ukor immediately. Easy to gate behind the same config knob with a `skipLargeFunctions` boolean.

## Key files

- `src/lib/rooibos/CodeCoverageProcessor.ts` — the visitor, deferred-inserts logic, the BranchCoverage type. `ensureFunctionTracked` registers functions; `pendingFunctionReports` and `pendingLineReports` are flushed after the walk in `_processFile` at the bottom of the walk block. Split logic would slot in around the flush.
- `src/lib/rooibos/RooibosConfig.ts` — add `coverageMaxFunctionStatements?: number` and optionally `skipLargeFunctions?: boolean`.
- `framework/src/source/rooibos/Coverage.bs` — runtime lcov writer; no changes needed for split.
- `coverage-sample/` — the benchmark project; add a sample test case with a deliberately-huge function once split works, to demonstrate it stays instrumented.
- `/Users/chris/roku/ukor/` — the real-world canary. Roll the split logic, remove the manager/service exclusions from `launcher/bsconfig-tests.json`, retry the build+deploy.

## Workflow notes for the next session

- The user's build command is `cd launcher; npx bsc --project bsconfig-tests.json` from ukor root — **do not** substitute `npm run buildAutomatedTests` or anything else.
- They have two Roku devices: `192.168.1.93` (limited dev token, errors with "Channel token missing persist_license") and `192.168.1.250` (full dev token). Use `.250`.
- Password is `aaaa` on both.
- Source maps must be excluded from the zip (already handled — `rokuDeploy.zipFolder` is called with `['**/*', '!**/*.map']` in `src/cli.ts`).
- To test, the canonical sequence is: rebuild rooibos dist (`npm run build` from `/Users/chris/roku/rooibos`) → ukor will pick it up via the symlink → run `cd launcher; npx bsc --project bsconfig-tests.json` from ukor root → run the rooibos CLI with `--package /Users/chris/roku/ukor/dist/launcher`.

## Suggested starting prompt for the new session

> The rooibos coverage feature branch ships full TS-Istanbul parity but trips the Roku per-function bytecode cap on real apps. Read `/Users/chris/roku/rooibos/handoff.md` for full context. Implement auto-splitting of large function bodies in `src/lib/rooibos/CodeCoverageProcessor.ts`: when a function body would exceed a configurable statement threshold, split it into helper chunks so the per-function cap isn't tripped. Start by reading the existing visitor's deferred-insert flush at the bottom of `_processFile`. Propose your split strategy (handling `return`, `exit for`/`while`, `goto`, throws) before implementing. Verify with the unit tests in `CodeCoverageProcessor.spec.ts` and then end-to-end against the ukor sample at `/Users/chris/roku/ukor/`.
