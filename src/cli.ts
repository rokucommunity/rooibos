#!/usr/bin/env node

import { RendezvousTracker, TelnetAdapter } from 'roku-debug';
import type { BsConfig } from 'brighterscript';
import { LogLevel, util, ProgramBuilder } from 'brighterscript';
import * as yargs from 'yargs';
import { RokuDeploy } from 'roku-deploy';
import * as fs from 'fs';
import * as path from 'path';

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
    const builder = new ProgramBuilder();

    builder.logger.logLevel = logLevel;


    await builder.run(<any>{ ...options, retainStagingDir: true, createPackage: true });

    const device = { host: host };

    const rokuDeploy = new RokuDeploy();
    const deviceInfo = await rokuDeploy.getDeviceInfo({ device: device });
    const rendezvousTracker = new RendezvousTracker({ softwareVersion: deviceInfo['software-version'] }, { device: device, remotePort: 8085 } as any);
    const telnet = new TelnetAdapter({ device: device }, rendezvousTracker);

    telnet.logger.logLevel = logLevel;
    await telnet.activate();
    await telnet.connect();

    const failRegex = /\[Rooibos Result\]: (FAIL|PASS)/g;
    const endRegex = /\[Rooibos Shutdown\]/g;

    async function doExit(emitAppExit = false) {
        if (emitAppExit) {
            (telnet as any).beginAppExit();
        }
        await rokuDeploy.keyPress({ device: device, key: 'Home' });
        process.exit(currentErrorCode);
    }

    telnet.on('console-output', (output) => {
        console.log(output);

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
        const outFile = bsConfig.outFile;
        console.log(`Deploying ${outFile} to ${host}`);
        await rokuDeploy.sideload({
            password: password,
            device: device,
            zip: path.resolve(process.cwd(), outFile)
        });
    }

    await deployBuiltFiles();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
