#!/usr/bin/env node

import { RendezvousTracker, TelnetAdapter } from 'roku-debug';
import type { BsConfig } from 'brighterscript';
import { LogLevel, util, ProgramBuilder } from 'brighterscript';
import * as yargs from 'yargs';
import { RokuDeploy } from 'roku-deploy';
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import type { CoverageMap as CoverageModelJson } from './lib/rooibos/CodeCoverageProcessor';
import { resolveCliRooibosConfig } from './lib/rooibos/RooibosConfig';
import { resolveCliDevice } from './lib/rooibos/resolveCliDevice';
import type { ResolvedCliDevice } from './lib/rooibos/resolveCliDevice';
import { loadCoverageModel, writeCoverageReportsFromCounts } from './lib/rooibos/CoverageReporter';

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

// Resolved once by the argument check below, so main() can rely on a valid target and password.
let password: string;
let target: ResolvedCliDevice;

let options = yargs
    .usage('$0', 'Rooibos: a simple, flexible, fun Brightscript test framework for Roku Scenegraph apps')
    .help('help', 'View help information about this tool.')
    .option('project', { type: 'string', description: 'Path to a bsconfig.json project file.' })
    .option('host', { type: 'string', description: 'Host of the Roku device to connect to. Falls back to ROKU_HOST.' })
    .option('esn', { type: 'string', description: 'ESN of a Roku Cloud Emulator device to run on. Requires --token or ROKU_RCE_TOKEN. Cannot be combined with --host or --instance-url.' })
    .option('instance-url', { type: 'string', description: 'URL of a Roku Cloud Emulator instance to run on. Requires --token or ROKU_RCE_TOKEN. Cannot be combined with --host or --esn.' })
    .option('token', { type: 'string', description: 'Roku Cloud Emulator access token (used with --esn or --instance-url). Falls back to the ROKU_RCE_TOKEN environment variable.' })
    .option('password', { type: 'string', description: 'Password of the Roku device to connect to. Falls back to ROKU_PASSWORD.' })
    .option('log-level', { type: 'string', defaultDescription: '"log"', description: 'The log level. Value can be "error", "warn", "log", "info", "debug".' })
    .option('coverage-dir', { type: 'string', default: './coverage', description: 'Directory to write coverage reports into when codeCoverage is on: lcov.info, coverage-final.json and an html/ report.' })
    .option('code-coverage', { type: 'boolean', description: 'Turn code coverage on (or off with --no-code-coverage) for the CLI\'s build, overriding the rooibos block of the bsconfig. Has no effect with --no-build.' })
    .option('staging-dir', { type: 'string', description: 'Path to the built package directory (staging output). With --no-build this is zipped and deployed as-is; otherwise it overrides where the build stages. Coverage models are read from here.' })
    .option('build', { type: 'boolean', default: true, description: 'Pass --no-build to skip the internal bsc build and deploy an existing staging directory (from --staging-dir or the bsconfig). Assumes it was built with the rooibos plugin so coverage helpers are present.' })
    .check((argv) => {
        password = argv.password ?? process.env.ROKU_PASSWORD;
        if (!password) {
            return new Error('You must provide a password. (--password, or ROKU_PASSWORD in .env)');
        }
        target = resolveCliDevice({ host: argv.host, esn: argv.esn, instanceUrl: argv['instance-url'], token: argv.token }, process.env);
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

    const rooibosConfig = resolveCliRooibosConfig((rawConfig as any).rooibos, { codeCoverage: options['code-coverage'] });
    if (options['code-coverage'] !== undefined && options.build === false) {
        console.warn('[rooibos] --code-coverage/--no-code-coverage has no effect with --no-build: the existing package was already built, so its coverage setting is whatever it was built with');
    }

    const { device, label: deviceLabel } = target;

    const logLevel = LogLevel[options['log-level']] ?? bsConfig.logLevel;
    // roku-deploy v4 and roku-debug 0.24 address the target via a device config (resolved
    // by the argument check) rather than a bare `host` string.
    const rokuDeploy = new RokuDeploy();
    const skipBuild = options.build === false;

    // bsc v1 stages the built package contents in `outDir` (the deprecated stagingDir and
    // stagingFolderPath fields were already folded into it above); --staging-dir overrides it.
    const stagingDirOverride = options['staging-dir'] ? path.resolve(String(options['staging-dir'])) : undefined;
    const buildOutDir = stagingDirOverride ?? path.resolve(bsConfig.outDir);

    /**
     * Ordered candidate locations for the built package contents: the --staging-dir
     * override, then the bsconfig's outDir.
     */
    function stagingDirCandidates(): string[] {
        return [...new Set([stagingDirOverride, path.resolve(bsConfig.outDir)].filter((candidate) => candidate !== undefined))];
    }

    // Resolved path to the .zip we'll actually deploy when skipping the build. We zip the
    // staging dir into a temp-dir zip ourselves rather than handing the directory
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
        // the zip must live outside the staging dir (bsc v1 stages into ./out by default), or the
        // next --no-build run would pack this zip into the new one
        const zipDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rooibos-'));
        // every exit path (including failures before the sideload and the process.exit calls) runs this
        process.on('exit', () => {
            fsExtra.removeSync(zipDir);
        });
        const zipped = path.join(zipDir, 'rooibos-prebuilt.zip');
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
        // --staging-dir (if given) becomes bsc's outDir; passing it as the deprecated stagingDir
        // would be ignored whenever the bsconfig sets outDir
        const { token: _token, esn: _esn, 'instance-url': _instanceUrlKebab, instanceUrl: _instanceUrl, 'staging-dir': _stagingDirKebab, stagingDir: _stagingDir, ...buildOptions } = options;
        await builder.run(<any>{
            ...buildOptions,
            ...(stagingDirOverride ? { outDir: stagingDirOverride } : {}),
            ...(rooibosConfig ? { rooibos: rooibosConfig } : {}),
            retainStagingDir: true
        });
    }

    const deviceInfo = await rokuDeploy.getDeviceInfo({ device: device });
    const rendezvousTracker = new RendezvousTracker({ softwareVersion: deviceInfo['software-version'] }, { device: device, remotePort: 8085 } as any);
    const telnet = new TelnetAdapter({ device: device }, rendezvousTracker);

    telnet.logger.logLevel = logLevel;
    await telnet.activate();
    await telnet.connect();

    const failRegex = /\[Rooibos Result\]: (FAIL|PASS)/g;
    const endRegex = /\[Rooibos Shutdown\]/g;

    const outputDir = path.resolve(options['coverage-dir']);
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

    /** Dumps the raw device stream into the output dir so a capture is never lost. */
    function saveRawCapture(raw: string) {
        const rawPath = path.join(outputDir, 'coverage-counts.raw');
        fsExtra.outputFileSync(rawPath, raw);
        console.error(`[rooibos] raw coverage output saved to ${rawPath}`);
    }

    /** The device printed the condensed hit-counts stream. */
    function writeCoverageFromCounts(rawCounts: string) {
        const model = findCoverageModel();
        if (!model) {
            console.error('[rooibos] the device sent condensed coverage counts but no components/rooibos/CodeCoverage.json was found in the package or staging dir - cannot build coverage reports');
            saveRawCapture(rawCounts);
            return;
        }
        coverageReportPromise = writeCoverageReportsFromCounts({
            rawCounts: rawCounts,
            model: model,
            outputDir: outputDir
        }).catch(e => {
            console.error('[rooibos] failed to write coverage reports:', e);
            saveRawCapture(rawCounts);
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
            if (capturingCounts) {
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
        // With --no-build, deploy the staging dir we just zipped; otherwise sideload the
        // outDir that the rooibos build just staged.
        if (deployZipPath) {
            console.log(`Deploying ${deployZipPath} to ${deviceLabel}`);
            await rokuDeploy.sideload({
                password: password,
                device: device,
                zip: deployZipPath
            });
            return;
        }
        console.log(`Deploying ${buildOutDir} to ${deviceLabel}`);
        await rokuDeploy.sideload({
            password: password,
            device: device,
            dir: buildOutDir
        });
    }

    await deployBuiltFiles();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
