#!/usr/bin/env node

import { RendezvousTracker, TelnetAdapter } from 'roku-debug';
import type { BsConfig } from 'brighterscript';
import { LogLevel, util, ProgramBuilder } from 'brighterscript';
import * as yargs from 'yargs';
import { RokuDeploy } from 'roku-deploy';
import * as fs from 'fs';
import * as path from 'path';
import type { CoverageMap as CoverageModelJson } from './lib/rooibos/CodeCoverageProcessor';
import { loadCoverageModel, writeCoverageReports, writeCoverageReportsFromCounts } from './lib/rooibos/CoverageReporter';

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
    .option('package', { type: 'string', description: 'Path to a pre-built .zip to deploy. When set, the rooibos CLI skips its own build step. Assumes the package was already built with the rooibos plugin so coverage helpers are present in the bundled code.' })
    .check((argv) => {
        if (!argv.host) {
            return new Error('You must provide a host. (--host)');
        }
        if (!argv.password) {
            return new Error('You must provide a password. (--password)');
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

    const host = options.host ?? bsConfig.host;
    const password = options.password ?? bsConfig.password;

    const logLevel = LogLevel[options['log-level']] ?? bsConfig.logLevel;
    const rokuDeploy = new RokuDeploy();
    const prebuiltPackage = options.package;
    // Resolved path to the .zip we'll actually deploy. When --package points at a directory
    // we zip it into out/rooibos-prebuilt.zip first, since roku-deploy.publish only takes
    // an existing zip.
    let deployZipPath: string | undefined;

    if (prebuiltPackage) {
        const resolved = path.resolve(prebuiltPackage);
        if (!fs.existsSync(resolved)) {
            console.error(`[rooibos] --package path not found: ${resolved}`);
            process.exit(1);
        }
        if (fs.statSync(resolved).isDirectory()) {
            const zipped = path.resolve('out/rooibos-prebuilt.zip');
            fs.mkdirSync(path.dirname(zipped), { recursive: true });
            console.log(`Zipping pre-built folder ${resolved} -> ${zipped}`);
            // Exclude source maps - they're useful in the staging dir but shouldn't ship
            // in the package (they bloat channel size and Roku has no use for them).
            await rokuDeploy.zipFolder(resolved, zipped, undefined, ['**/*', '!**/*.map']);
            deployZipPath = zipped;
        } else {
            console.log(`Using pre-built package: ${resolved} (skipping rooibos build)`);
            deployZipPath = resolved;
        }
    } else {
        const builder = new ProgramBuilder();
        builder.logger.logLevel = logLevel;
        await builder.run(<any>{ ...options, retainStagingDir: true, createPackage: true });
    }

    const deviceInfo = await rokuDeploy.getDeviceInfo({ host: host });
    const rendezvousTracker = new RendezvousTracker({ softwareVersion: deviceInfo['software-version'] }, { host: host, remotePort: 8085 } as any);
    const telnet = new TelnetAdapter({ host: options.host }, rendezvousTracker);

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
        const candidates: string[] = [];
        if (prebuiltPackage) {
            const resolved = path.resolve(prebuiltPackage);
            if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
                candidates.push(path.join(resolved, 'components', 'rooibos', 'CodeCoverage.json'));
            }
        }
        for (const staging of [(bsConfig as any).stagingDir, bsConfig.stagingFolderPath]) {
            if (staging) {
                candidates.push(path.resolve(String(staging), 'components', 'rooibos', 'CodeCoverage.json'));
            }
        }
        for (const candidate of candidates) {
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
        fs.mkdirSync(path.dirname(rawPath), { recursive: true });
        fs.writeFileSync(rawPath, raw);
        console.error(`[rooibos] raw coverage output saved to ${rawPath}`);
    }

    /** Legacy path: the device printed a full lcov report (printLcov flag). */
    function writeCoverageFromLcov(rawLcov: string) {
        const model = findCoverageModel();
        const pathMap = new Map<string, string>();
        for (const file of model?.files ?? []) {
            if (file?.sourceFile && file.sourcePath) {
                pathMap.set(file.sourceFile, file.sourcePath);
            }
        }
        if (pathMap.size === 0) {
            console.log('[rooibos] no coverage path map found; lcov SF paths fall back to pkg-relative locations');
        }
        coverageReportPromise = writeCoverageReports({
            rawLcov: rawLcov,
            lcovPath: coverageOutputPath,
            istanbulJsonPath: path.join(path.dirname(coverageOutputPath), 'coverage-final.json'),
            htmlDir: options['coverage-html'],
            sourceRoot: options['coverage-src-root'],
            pathMap: pathMap.size > 0 ? pathMap : undefined
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
        await rokuDeploy.pressHomeButton(host); // roku-deploy v4: keyPress({ host: options.host, key: 'home' });
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
        // When the user supplied a --package path, deploy the (possibly just-zipped) artifact;
        // otherwise fall back to the bsconfig-driven outFile that the rooibos build just produced.
        const packagePath = deployZipPath ?? path.resolve(process.cwd(), bsConfig.outFile);
        console.log(`Deploying ${packagePath} to ${host}`);
        await rokuDeploy.publish({ // roku-deploy v4: .sideload({...})
            password: password,
            host: host,
            outFile: path.basename(packagePath),
            outDir: path.dirname(packagePath)
        });
    }

    await deployBuiltFiles();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
