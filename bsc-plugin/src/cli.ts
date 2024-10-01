#!/usr/bin/env node

import { RendezvousTracker, TelnetAdapter } from 'roku-debug';
import type { BsConfig } from 'brighterscript';
import { LogLevel, util, ProgramBuilder } from 'brighterscript';
import * as yargs from 'yargs';
import { RokuDeploy } from 'roku-deploy';
import * as fs from 'fs';

let options = yargs
    .usage('$0', 'Rooibos: a simple, flexible, fun Brightscript test framework for Roku Scenegraph apps')
    .help('help', 'View help information about this tool.')
    .option('project', { type: 'string', description: 'Path to a bsconfig.json project file.' })
    .option('host', { type: 'string', description: 'Host of the Roku device to connect to. Overrides value in bsconfig file.' })
    .option('password', { type: 'string', description: 'Password of the Roku device to connect to. Overrides value in bsconfig file.' })
    .option('log-level', { type: 'string', defaultDescription: '"log"', description: 'The log level. Value can be "error", "warn", "log", "info", "debug".' })
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
        let bsconfigPath = argv.project || './bsconfig.json';

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
    const builder = new ProgramBuilder();

    builder.logger.logLevel = logLevel;


    await builder.run(<any>{ ...options, retainStagingDir: true });

    const rokuDeploy = new RokuDeploy();
    const deviceInfo = await rokuDeploy.getDeviceInfo({ host: host });
    const rendezvousTracker = new RendezvousTracker({ softwareVersion: deviceInfo['software-version'] }, { host: host, remotePort: 8085 } as any);
    const telnet = new TelnetAdapter({ host: options.host }, rendezvousTracker);

    telnet.logger.logLevel = logLevel;
    await telnet.activate();
    await telnet.connect();

    const failRegex = /RESULT: Fail/g;
    const endRegex = /\[END TEST REPORT\]/g;

    async function doExit(emitAppExit = false) {
        if (emitAppExit) {
            (telnet as any).beginAppExit();
        }
        await rokuDeploy.keyPress({ host: options.host, key: 'home' });
        process.exit(currentErrorCode);
    }

    telnet.on('console-output', (output) => {
        console.log(output);

        //check for Fails or Crashes
        let failMatches = failRegex.exec(output);
        if (failMatches && failMatches.length > 0) {
            currentErrorCode = 1;
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

        await rokuDeploy.sideload({
            password: password,
            host: host,
            outFile: outFile,
            outDir: process.cwd()
        });
    }

    await deployBuiltFiles();
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
