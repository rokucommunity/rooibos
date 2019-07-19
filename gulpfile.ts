import { series } from "gulp";
import { RooibosProcessor, createProcessorConfig, ProcessorConfig } from "rooibos-preprocessor";

const concat = require('gulp-concat');
const gulp = require('gulp');
const path = require('path');
const del = require('del');
const header = require('gulp-header');
const pkg = require('./package.json');
const distDir = 'dist';
const outDir = 'out';
const distFile = `rooibosDist.brs`;
const fullDistPath = path.join(distDir, distFile);
const fs = require('fs');
const rmLines = require('gulp-rm-lines');
const rokuDeploy = require('roku-deploy');
const cp = require('child_process');

const args = {
  host: process.env.ROKU_HOST || '192.168.16.3',
  username: process.env.ROKU_USER || 'rokudev',
  password: process.env.ROKU_PASSWORD || 'aaaa',
  rootDir: './',
  files: ['frameworkTests/**/*'],
  outDir: './out',
  retainStagingFolder: true
};


export function clean() {
  const distPath = path.join(distDir, '**');
  console.log('Doing a clean at ' + distPath);
  return del([distPath, outDir], { force: true });
}

function createDirectories() {
  return gulp.src('*.*', { read: false })
    .pipe(gulp.dest(distDir))
    .pipe(gulp.dest(outDir));
}

function squash() {
  var banner = [`'/**`,
    `' * ${pkg.name} - ${pkg.description}`,
    `' * @version v${pkg.version}`,
    `' * @link ${pkg.homepage}`,
    `' * @license ${pkg.license}`,
    `' */`,
    ``].join(`\n`);

  return gulp.src('./src/*.brs')
    .pipe(concat(distFile))
    .pipe(rmLines({
      'filters': [/^\s*'/i, /((\r\n|\n|\r)$)|(^(\r\n|\n|\r))|^\s*$/i]
    }))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest(distDir));
}

function copyToSamples(cb) {
  const frameworkFile = path.join('samples/example/source/tests/rooibos', distFile);
  if (fs.existsSync(frameworkFile)) {
    fs.unlinkSync(frameworkFile);
  }
  fs.copyFileSync(fullDistPath, frameworkFile);
  cb();
}

function copyToTests(cb) {
  const frameworkFile = path.join('frameworkTests/source/tests', distFile);
  if (fs.existsSync(frameworkFile)) {
    fs.unlinkSync(frameworkFile);
  }
  fs.copyFileSync(fullDistPath, frameworkFile);
  cb();
}

/**
 * This target is used for CI
 */
export async function prepareFrameworkTests(cb) {
  await rokuDeploy.prepublishToStaging(args);
  
  let config = createProcessorConfig({
    "projectPath": "out/.roku-deploy-staging",
    "testsFilePattern": [
      "**/tests/**/*.brs",
      "!**/rooibosDist.brs",
      "!**/rooibosFunctionMap.brs",
      "!**/TestsScene.brs"
    ]
  });
  let processor = new RooibosProcessor(config);
  processor.processFiles();
  
  cb();
}

export async function prepareCodeCoverageTests(cb) {
  await rokuDeploy.prepublishToStaging(args);
  
  let config = createProcessorConfig({
    "projectPath": "out/.roku-deploy-staging",
    "testsFilePattern": [
      "**/tests/**/*.brs",
      "!**/rooibosDist.brs",
      "!**/rooibosFunctionMap.brs",
      "!**/TestsScene.brs"
    ],
    "sourceFilePattern": [
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
    "isRecordingCodeCoverage": true
  });
  let processor = new RooibosProcessor(config);
  processor.processFiles();

  cb();
}

export async function zipFrameworkTests(cb) {
  await rokuDeploy.zipPackage(args);
}

export async function deployFrameworkTests(cb) {
  await rokuDeploy.publish(args);
}

export function doc(cb) {
  let task = cp.exec('./node_modules/.bin/jsdoc -c jsdoc.json -t node_modules/minami -d docs');
  return task;
}

exports.build = series(clean, createDirectories, squash, copyToSamples, copyToTests);
exports.runFrameworkTests = series(exports.build, prepareFrameworkTests, zipFrameworkTests, deployFrameworkTests)
exports.prePublishFrameworkTests = series(exports.build, prepareFrameworkTests)
exports.prePublishFrameworkCodeCoverage = series(exports.build, prepareCodeCoverageTests)
exports.dist = series(exports.build, doc);