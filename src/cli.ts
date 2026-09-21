#!/usr/bin/env node

import { RendezvousTracker, TelnetAdapter } from 'roku-debug';
import type { BsConfig } from 'brighterscript';
import { LogLevel, util, ProgramBuilder } from 'brighterscript';
import * as yargs from 'yargs';
import { RokuDeploy } from 'roku-deploy';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import type { CoverageMap as CoverageModelJson } from './lib/rooibos/CodeCoverageProcessor';
import { loadCoverageModel, pathMapFromModel, writeCoverageReports, writeCoverageReportsFromCounts } from './lib/rooibos/CoverageReporter';

/**
 * Load simple `KEY=value` pairs from a .env file into process.env, without
 * overwriting variables that are already set in the real environment.
 */
function loadDotEnv(envPath = '.env') {
    if (!fs.existsSync(envPath)) {
        return;
    }
    const contents = fs.readFileSync(envPath, 'utf8');
    for (const line of contents.split(/\r?\n/)) {
        const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
        if (!match) {
            //skip blanks and comments
            continue;
        }
        let value = match[2].trim();
        //strip matching surrounding quotes
        if (/^"(.*)"$/.test(value) || /^'(.*)'$/.test(value)) {
            value = value.slice(1, -1);
        }
        process.env[match[1]] ??= value;
    }
}

loadDotEnv();

let options = yargs
    .usage('$0', 'Rooibos: a simple, flexible, fun Brightscript test framework for Roku Scenegraph apps')
    .help('help', 'View help information about this tool.')
    .option('project', { type: 'string', description: 'Path to a bsconfig.json project file.' })
    .option('host', { type: 'string', description: 'Host of the Roku device to connect to. Overrides value in bsconfig file.' })
    .option('password', { type: 'string', description: 'Password of the Roku device to connect to. Overrides value in bsconfig file.' })
    .option('log-level', { type: 'string', defaultDescription: '"log"', description: 'The log level. Value can be "error", "warn", "log", "info", "debug".' })
    .option('coverage-output', { type: 'string', description: 'Path to write the standard lcov.info file. The canonical Istanbul coverage-final.json is written next to it. Defaults to ./coverage/lcov.info when coverage markers are seen.' })
    .option('coverage-html', { type: 'string', description: 'Directory to render an Istanbul-style HTML report into after coverage is captured.' })
    .option('coverage-src-root', { type: 'string', description: 'Repository root of the app under test: lcov SF paths are emitted relative to it and source files are resolved beneath it. Defaults to the current working directory.' })
    .option('staging-dir', { type: 'string', description: 'Path to the built package directory (staging output). With --no-build this is zipped and deployed as-is; otherwise it overrides where the build stages. Coverage models are read from here.' })
    .option('build', { type: 'boolean', default: true, description: 'Pass --no-build to skip the internal bsc build and deploy an existing staging directory (from --staging-dir or the bsconfig). Assumes it was built with the rooibos plugin so coverage helpers are present.' })
    .check((argv) => {
        if (!argv.host && !process.env.ROKU_HOST) {
            return new Error('You must provide a host. (--host, or ROKU_HOST in .env)');
        }
        if (!argv.password && !process.env.ROKU_PASSWORD) {
            return new Error('You must provide a password. (--password, or ROKU_PASSWORD in .env)');
        }
        if (!argv.project) {
            console.log('No project file specified. Using "./bsconfig.json"');

        }
        let bsconfigPath = argv.project ?? './bsconfig.json';

        if (!fs.existsSync(bsconfigPath)) {
            return new Error(`Unable to load ${bsconfigPath}`);
        }
        return true;
    })
    .argv;


async function main() {
    let currentErrorCode = 0;
    let bsconfigPath = options.project ?? 'bsconfig.json';
    console.log(`Using bsconfig: ${bsconfigPath}`);

    const rawConfig: BsConfig = util.loadConfigFile(bsconfigPath);
    const bsConfig = util.normalizeConfig(rawConfig);

    const host = options.host ?? bsConfig.host ?? process.env.ROKU_HOST;
    const password = options.password ?? bsConfig.password ?? process.env.ROKU_PASSWORD;

    const logLevel = LogLevel[options['log-level']] ?? bsConfig.logLevel;
    // roku-deploy v4 and roku-debug 0.24 address the target via a device config rather than
    // a bare `host` string.
    const device = { host: host };
    const rokuDeploy = new RokuDeploy();
    const skipBuild = options.build === false;

    /**
     * Ordered candidate locations for the built package contents: the --staging-dir
     * override, then the bsconfig staging fields, then roku-deploy's default staging
     * location (used when no staging dir is configured anywhere).
     */
    function stagingDirCandidates(): string[] {
        const candidates: string[] = [];
        if (options['staging-dir']) {
            candidates.push(path.resolve(String(options['staging-dir'])));
        }
        for (const staging of [(bsConfig as any).stagingDir, bsConfig.stagingFolderPath]) {
            if (staging) {
                candidates.push(path.resolve(String(staging)));
            }
        }
        const outDir = bsConfig.outFile ? path.dirname(String(bsConfig.outFile)) : './out';
        candidates.push(path.resolve(outDir, '.roku-deploy-staging'));
        return candidates;
    }

    // Resolved path to the .zip we'll actually deploy when skipping the build. We zip the
    // staging dir into out/rooibos-prebuilt.zip ourselves rather than handing the directory
    // straight to sideload({ dir }), because that path does not forward file patterns and
    // would drop the source-map exclusion below. A directory is required either way - the
    // coverage model (components/rooibos/CodeCoverage.json) must be readable from it.
    let deployZipPath: string | undefined;

    if (skipBuild) {
        const stagingDir = stagingDirCandidates().find((c) => fs.existsSync(c));
        if (!stagingDir) {
            console.error('[rooibos] --no-build requires an existing staging directory: pass --staging-dir or set one in the bsconfig');
            process.exit(1);
        }
        if (!fs.statSync(stagingDir).isDirectory()) {
            console.error(`[rooibos] the staging dir must be a directory, not a file: ${stagingDir}`);
            process.exit(1);
        }
        const zipped = path.resolve('out/rooibos-prebuilt.zip');
        fs.mkdirSync(path.dirname(zipped), { recursive: true });
        console.log(`Zipping pre-built staging dir ${stagingDir} -> ${zipped}`);
        // Exclude source maps - they're useful in the staging dir but shouldn't ship
        // in the package (they bloat channel size and Roku has no use for them).
        // roku-deploy v4 replaced zipFolder(src, out, logger, files) with zip({...});
        // the file patterns still resolve relative to `dir`.
        await rokuDeploy.zip({ dir: stagingDir, out: zipped, files: ['**/*', '!**/*.map'] });
        deployZipPath = zipped;
    } else {
        const builder = new ProgramBuilder();
        builder.logger.logLevel = logLevel;
        // --staging-dir (if given) flows into bsc as its stagingDir via the spread
        await builder.run(<any>{ ...options, retainStagingDir: true, createPackage: true });
    }

    const deviceInfo = await rokuDeploy.getDeviceInfo({ device: device });
    const rendezvousTracker = new RendezvousTracker({ softwareVersion: deviceInfo['software-version'] }, { device: device, remotePort: 8085 } as any);
    const telnet = new TelnetAdapter({ device: device }, rendezvousTracker);

    telnet.logger.logLevel = logLevel;
    await telnet.activate();
    await telnet.connect();

    const failRegex = /\[Rooibos Result\]: (FAIL|PASS)/g;
    const endRegex = /\[Rooibos Shutdown\]/g;

    const coverageOutputPath = path.resolve(options['coverage-output'] ?? './coverage/lcov.info');
    // The user's rooibos config decides how coverage is reported ('lcov' | 'nyc'). When
    // set, the device prints the condensed counts stream instead of lcov text.
    const coverageReporter = (rawConfig as any).rooibos?.coverageReporter as string | undefined;
    let capturingCoverage = false;
    let capturingCounts = false;
    let coverageBuffer: string[] = [];
    let coverageReportPromise: Promise<void> | undefined;

    /**
     * The bsc plugin writes the static coverage model (line/function/branch shape plus
     * repo-relative source paths) into components/rooibos/CodeCoverage.json; read it back
     * from wherever the deployed package contents live.
     */
    function findCoverageModel(): CoverageModelJson | undefined {
        for (const dir of stagingDirCandidates()) {
            const candidate = path.join(dir, 'components', 'rooibos', 'CodeCoverage.json');
            const model = loadCoverageModel(candidate);
            if (model) {
                console.log(`[rooibos] using coverage model from ${candidate}`);
                return model;
            }
        }
        return undefined;
    }

    /** Dumps the raw device stream next to the lcov target so a capture is never lost. */
    function saveRawCapture(raw: string, suffix: string) {
        const rawPath = `${coverageOutputPath}.${suffix}`;
        fsExtra.outputFileSync(rawPath, raw);
        console.error(`[rooibos] raw coverage output saved to ${rawPath}`);
    }

    /** Legacy path: the device printed a full lcov report (printLcov flag). */
    function writeCoverageFromLcov(rawLcov: string) {
        const pathMap = pathMapFromModel(findCoverageModel());
        if (!pathMap) {
            console.log('[rooibos] no coverage path map found; lcov SF paths fall back to pkg-relative locations');
        }
        coverageReportPromise = writeCoverageReports({
            rawLcov: rawLcov,
            lcovPath: coverageOutputPath,
            istanbulJsonPath: path.join(path.dirname(coverageOutputPath), 'coverage-final.json'),
            htmlDir: options['coverage-html'],
            sourceRoot: options['coverage-src-root'],
            pathMap: pathMap
        }).catch(e => {
            console.error('[rooibos] failed to write coverage reports:', e);
            saveRawCapture(rawLcov, 'raw');
        });
    }

    /** coverageReporter path: the device printed the condensed hit-counts stream. */
    function writeCoverageFromCounts(rawCounts: string) {
        const model = findCoverageModel();
        if (!model) {
            console.error('[rooibos] the device sent condensed coverage counts but no components/rooibos/CodeCoverage.json was found in the package or staging dir - cannot build coverage reports');
            saveRawCapture(rawCounts, 'counts.raw');
            return;
        }
        const reporter = coverageReporter === 'nyc' ? 'nyc' : 'lcov';
        coverageReportPromise = writeCoverageReportsFromCounts({
            rawCounts: rawCounts,
            model: model,
            reporter: reporter,
            lcovPath: coverageOutputPath,
            istanbulJsonPath: path.join(path.dirname(coverageOutputPath), 'coverage-final.json'),
            htmlDir: options['coverage-html'],
            sourceRoot: options['coverage-src-root']
        }).catch(e => {
            console.error('[rooibos] failed to write coverage reports:', e);
            saveRawCapture(rawCounts, 'counts.raw');
        });
    }

    async function doExit(emitAppExit = false) {
        // don't kill the process while coverage reports are still being written
        await coverageReportPromise;
        if (emitAppExit) {
            (telnet as any).beginAppExit();
        }
        await rokuDeploy.keyPress({ device: device, key: 'Home' });
        process.exit(currentErrorCode);
    }

    telnet.on('console-output', (output) => {
        console.log(output);

        for (const line of output.split('\n')) {
            if (line.includes('+-=-coverage-counts:start')) {
                capturingCounts = true;
                coverageBuffer = [];
                continue;
            }
            if (line.includes('+-=-coverage-counts:end')) {
                capturingCounts = false;
                writeCoverageFromCounts(coverageBuffer.join('\n'));
                continue;
            }
            if (line.includes('+-=-coverage:start')) {
                capturingCoverage = true;
                coverageBuffer = [];
                continue;
            }
            if (line.includes('+-=-coverage:end')) {
                capturingCoverage = false;
                writeCoverageFromLcov(coverageBuffer.join('\n'));
                continue;
            }
            if (capturingCoverage || capturingCounts) {
                coverageBuffer.push(line);
            }
        }

        //check for Fails or Crashes
        let failMatches = failRegex.exec(output);
        if (failMatches && failMatches.length > 0) {
            if (failMatches[1] === 'FAIL') {
                currentErrorCode = 1;
            }
        }

        let endMatches = endRegex.exec(output);
        if (endMatches && endMatches.length > 0) {
            doExit(true).catch(e => {
                console.error(e);
                process.exit(1);
            });
        }
    });

    telnet.on('runtime-error', (error) => {
        console.error(`Runtime Error: ${error.errorCode} - ${error.message}`);
        currentErrorCode = 1;
        doExit(true).catch(e => {
            console.error(e);
            process.exit(1);
        });
    });

    telnet.on('app-exit', () => {
        doExit(false).catch(e => {
            console.error(e);
            process.exit(1);
        });
    });

    // Actually start the unit tests

    //deploy a .zip package of your project to a roku device
    async function deployBuiltFiles() {
        // With --no-build, deploy the staging dir we just zipped; otherwise fall back to the
        // bsconfig-driven outFile that the rooibos build just produced.
        const packagePath = deployZipPath ?? path.resolve(process.cwd(), bsConfig.outFile);
        console.log(`Deploying ${packagePath} to ${host}`);
        // roku-deploy v4 replaced publish({ host, outDir, outFile }) with sideload({ device, zip }).
        await rokuDeploy.sideload({
            password: password,
            device: device,
            zip: packagePath
        });
    }

    await deployBuiltFiles();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
