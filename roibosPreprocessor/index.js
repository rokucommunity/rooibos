#!/usr/bin/env node
const program = require('commander');
const FileProcessor = require('./lib/fileProcessor');
const fs = require('fs');
const inspect = require('util').inspect;
const debug = require('debug')('rooibosProcessor');

program
	.version('0.0.1')
	.description('Rooibos Preprocessor');

program
	.command('buildMap <testsPath>')
	.alias('m')
	.description('build rooibos map')
	.action((testsPath) => {
		console.log(`Processing files from ${testsPath}`)
		debug(`Processing files from ${testsPath}`)
		let processor = new FileProcessor(testsPath);
		processor.processFiles();
	});

program.parse(process.argv);