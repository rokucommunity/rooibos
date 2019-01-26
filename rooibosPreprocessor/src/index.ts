#!/usr/bin/env node
import RooibosProcessor from './lib/RooibosProcessor';
const program = require('commander');
const fs = require('fs');
const inspect = require('util').inspect;

console.log(`Running`);

program
  .version('0.1.0')
  .description('Rooibos Preprocessor');

program
  .command('process <testsFolder>')
  .alias('p')
  .description(`
  processes a brightscript SceneGraph project and creates json data strcutures
  which can be used by the rooibos unit testing framework, or vsCode IDE

  HAPPY TESTING :)
  `)
  .action((testsPath) => {
    console.log(`Processing test path ${testsPath}`);
    let processor = new RooibosProcessor(testsPath);
    processor.processFiles();
  });

program.parse(process.argv);
