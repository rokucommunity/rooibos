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
  .command('process <config>')
  .alias('p')
  .description('process project')
  .action((testsPath) => {
    let config = JSON.parse(fs.readFileSync(testsPath, 'utf8'));
    console.log(`Processing test path ${testsPath}`);
    let processor = new RooibosProcessor(config);
    processor.processFiles();
  });

program.parse(process.argv);
