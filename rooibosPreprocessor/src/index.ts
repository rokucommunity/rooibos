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
    console.log(`Processing....`);
    console.log(`   test path ${testsPath}`);
    console.log(`   root path is  ${rootPath}`);
    console.time('Finished in:');
    let processor = new RooibosProcessor(testsPath, rootPath);
    processor.processFiles();
    console.timeEnd('Finished in:');
  });

program.parse(process.argv);
