#! /usr/bin/env node

const { TelnetAdapter, RendezvousTracker } = require("roku-debug");
const { RokuDeploy } = require('roku-deploy');
const path = require('path');

require('dotenv').config()

const { program } = require('commander');

program
  .name("runRooibosTests")
  .description("Runs the unit-tests brand, writing output to console")
  .option('--host <host>', 'Use a host different from default (ROKU_HOST) in .env file')
  .option('--password <password>', 'Use a password different from default (ROKU_PASSWORD) in .env file')
  .option('-v, --verbose', 'Set Verbose output');


const options = program.opts();

const host = options.host ?? process.env.ROKU_HOST;
const password = options.password ?? process.env.ROKU_PASSWORD;

if (!host || !password) {
  console.error(`You need to provide a host and password. You can do this by setting the ROKU_HOST and ROKU_PASSWORD environment variables or by using the --host and --password options.`);
  process.exit(1);
}
const rendezvousTracker = new RendezvousTracker();
const telnet = new TelnetAdapter({ host }, rendezvousTracker);
const rokuDeploy = new RokuDeploy();

telnet.rendezvousTracker.registerSourceLocator((filePath, lineNumber) => {
  return Promise.resolve({
    filePath: filePath,
    lineNumber: lineNumber,
    columnIndex: 0
  });
});

let logLevel = "debug";

if (!options.verbose) {
  logLevel = "error";

}


let currentErrorCode = 0;
telnet.logger.logLevel = logLevel;
telnet.activate()
telnet.connect()
const failRegex = /RESULT: Fail/g;
//const crashRegex = /Crashes\s*=\s*([1-9])/g;
const endRegex = /\[END TEST REPORT\]/g;

telnet.on('console-output', (output) => {
  console.log(output);

  //check for Fails or Crashes
  let failMatches = failRegex.exec(output);
  if (failMatches && failMatches.length > 0) {
    currentErrorCode = 1
  }

  let endMatches = endRegex.exec(output);
  if (endMatches && endMatches.length > 0) {
    doExit(true)
  }
});

telnet.on('runtime-error', (error) => {
  console.log(`Runtime Error: ${error.errorCode} - ${error.message}`);
  currentErrorCode = 1;
  doExit(true)
});

telnet.on('app-exit', (output) => {
  doExit(false)
});

async function doExit(emitAppExit) {
  if (emitAppExit) {
    telnet.emitter.emit('app-exit');
  }
  await rokuDeploy.keyPress({ host: host, key: 'home' });
  process.exit(currentErrorCode);
}

// Actually start the unit tests

//deploy a .zip package of your project to a roku device
async function deployBuiltFiles() {
  const stagingDir = path.join(process.cwd(), 'build').toString();
  const outDir = path.join(process.cwd(), 'out').toString();

  const outFile = 'roku-deploy.zip';
  await rokuDeploy.zip({
    stagingDir: stagingDir,
    outDir: outDir
  });

  await rokuDeploy.sideload({
    password: password,
    host: host,
    outDir: outDir,
    outFile: outFile
  });
}

deployBuiltFiles();