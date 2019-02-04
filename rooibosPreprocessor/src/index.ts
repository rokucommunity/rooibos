#!/usr/bin/env node
import RooibosProcessor from './lib/RooibosProcessor';
const program = require('commander');
const pkg = require('../package.json');
program
  .version(pkg.version)
  .description('Rooibos Preprocessor');

program
  .command('process <testsFolder> <rootPath>')
  .alias('p')
  .description(`
  processes a brightscript SceneGraph project and creates json data structures
  which can be used by the rooibos unit testing framework, or vsCode IDE

  HAPPY TESTING :)
  `)
  .action((testsPath, rootPath) => {
    console.log(`Processing test path ${testsPath}`);
    console.log(`Processing rooth path is  ${rootPath}`);
    let processor = new RooibosProcessor(testsPath, rootPath);
    processor.processFiles();
  });

program.parse(process.argv);
