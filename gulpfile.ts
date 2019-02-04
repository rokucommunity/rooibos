import { series } from "gulp";
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
const gulpCopy = require('gulp-copy');
const rokuDeploy = require('roku-deploy');
const cp = require('child_process');

const args = {
  host: '192.168.16.3',
  password: 'aaaa',
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
  fs.copyFile(fullDistPath, path.join('frameworkTests/source/tests', distFile), cb);
  fs.copyFile(fullDistPath, path.join('samples/Overview/source/tests', distFile), cb);
  fs.copyFile(fullDistPath, path.join('samples/nonEvalSample/source/tests', distFile), cb);
}

/**
 * This target is used for CI
 */
export function prepareFrameworkTests(cb) {
  rokuDeploy.prepublishToStaging(args);
  let task = cp.exec('rooibosC p out/.roku-deploy-staging/source/tests');
  task.stdout.pipe(process.stdout)
  return task;
}

export async function zipFrameworkTests(cb) {
  await rokuDeploy.zipPackage(args);
}

export async function deployFrameworkTests(cb) {
  await rokuDeploy.publish(args);
}

exports.build = series(clean, createDirectories, squash, copyToSamples);
exports.runFrameworkTests = series(exports.build, prepareFrameworkTests, zipFrameworkTests, deployFrameworkTests)
exports.prePublishFrameworkTests = series(exports.build, prepareFrameworkTests)