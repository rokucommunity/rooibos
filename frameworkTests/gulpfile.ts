import { series } from 'gulp';
import { FileProcessor } from 'burp-brightscript';
import { RooibosProcessor, createProcessorConfig } from 'rooibos-cli';
import { ProgramBuilder } from 'brighterscript';

import { inspect } from 'util';
import { BsConfig } from 'brighterscript/dist/BsConfig';

const gulp = require('gulp');
const gulpClean = require('gulp-clean');

let burpFileProcessor: FileProcessor;

export function createDirectories() {
  return gulp
    .src('*.*', { read: false })
    .pipe(gulp.dest('build'))
    .pipe(gulp.dest('out'));
}

export async function compile(cb) {
  let builder = new ProgramBuilder();
  burpFileProcessor = createBurpProcessor();
  builder.addFileResolver(projectFileResolver);

  let configFiles: any[] = [
    "manifest",
    "source/**/*.*",
    "components/**/*.*",
    "images/**/*.*",
    "font/**/*.*"
  ];

  let sourceDir = 'src';
  let config: BsConfig = {
    stagingFolderPath: 'build',
    createPackage: false,
    "rootDir": sourceDir,
    "autoImportComponentScript": true,
    "files": configFiles,
    "diagnosticFilters": [
      "source/rooibosFunctionMap.brs",
      "**/RALETrackerTask.*",
      1107,
      1001
    ],
    "showDiagnosticsInConsole": true
  }

  console.log(`using config ${inspect(config)}`);
  await builder.run(config);
  cb();
}

function projectFileResolver(pathAbsolute: string): string | undefined | Thenable<string | undefined> {
  let updated = burpFileProcessor.processFileWithPath(pathAbsolute, pathAbsolute.toLowerCase().endsWith('.brs'));
  return updated;
}

/*******************************************************************
 * testing
 *******************************************************************/

export async function prepareTests(cb) {
  let testFiles = [];
  testFiles = [
    '**/tests/**/*.bs',
    '**/tests/**/*.brs',
    '!**/rooibosDist.brs',
    '!**/rooibosFunctionMap.brs',
    '!**/TestsScene.brs'
  ];
  let config = createProcessorConfig({
    projectPath: 'build',
    outputPath: "source/tests",
    showFailuresOnly: true,
    testsFilePattern: testFiles
  });
  let processor = new RooibosProcessor(config);
  await processor.processFiles();
  cb();
}

export async function prepareCodeCoverageTests(cb) {
  let config = createProcessorConfig({
    projectPath: "build",
    outputPath: "source/tests",
    showFailuresOnly: true,
    testsFilePattern: [
      "**/tests/**/*.brs",
      "!**/rooibosDist.brs",
      "!**/rooibosFunctionMap.brs",
      "!**/TestsScene.brs"
    ],
    sourceFilePattern: [
      "**/*.brs",
      "**/*.xml",
      "!**/tests",
      "!**/rLog",
      "!**/rLogComponents",
      "!**/rooibosDist.brs",
      "!**/rooibosFunctionMap.brs",
      "!**/TestsScene.brs",
      "!**/ThreadUtils.brs"
    ],
    isRecordingCodeCoverage: true
  });
  let processor = new RooibosProcessor(config);
  processor.processFiles();

  cb();
}

/*******************************************************************
 * logging
 *******************************************************************/

export function createBurpProcessor(): FileProcessor {
  //NB - this will be replaced entirely with bsconfig settings, so the bsc compiler
  //will do this for us -this is a temporary solution 
  let replacements = getBsLogReplacements();
  console.log('Adding crash resilience to unit tests, by skipping assertions after a failure');
  replacements.push({
    regex: '(^( *\\t*)m\\.assert)',
    replacement: '  if not m.currentResult.isFail then $1'
  });

  return new FileProcessor({ replacements: replacements });
}

function getBsLogReplacements(): any[] {
  let replacements = [];
  const isLogDisabled = false;
  if (isLogDisabled) {
    console.log('stripping logs');
    replacements = [
      {
        regex: '(^\\s*(m\\.)*(log_method|log_info|log_error|log_verbose|log_debug|log_warn)\\(\\[)',
        replacement: '\'$1'
      },
      {
        regex: '(^\\s*(m\\.)*(registerLogger)\\((\\s*"))',
        replacement: '\'$1'
      },
      {
        regex: '(^\\s*(m\\.)*(logMethod|logInfo|logError|logVerbose|logDebug|logWarn|log_debug)\\()',
        replacement: '\'$1'
      }
    ];
  } else {
    console.log('Adding line numbers and package paths to log output');
    replacements = [
      {
        regex: '(^\\s*(?:m\\.)*(log_method|log_info|log_error|log_verbose)\\s*\\(\\s*\\[\\s*)m\\.className',
        replacement: '$1source_location'
      },
      {
        regex: '(^\\s*(?:m\\.)*(log_debug)\\s*\\(\\s*[0-9]*\\s*,\\s*\\[)\\s*m\\.className',
        replacement: '$1source_location'
      },
      {
        regex: '(^\\s*(m\\.)*(logInfo|logError|logVerbose|logDebug|logWarn|logMethod)\\((\\s*))',
        replacement: '$1source_location, '
      }
    ];
  }
  return replacements;
}

export function clean() {
  let dirs = ['build', 'out'];

  return gulp
    .src(dirs, {
      allowEmpty: true
    })
    .pipe(gulpClean({ force: true }));
};

/* Default task */
exports.prePublishTests = series(clean, createDirectories, compile, prepareTests);
exports.prePublishTests = series(clean, createDirectories, compile, prepareTests);
