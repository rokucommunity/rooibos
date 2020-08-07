import { series } from "gulp";
import { ProgramBuilder, BsConfig } from 'brighterscript';
import { inspect } from 'util';

const concat = require('gulp-concat');
const gulp = require('gulp');
const path = require('path');
const del = require('del');
const header = require('gulp-header');
const pkg = require('./package.json');
const distDir = 'dist';
const outDir = 'out';
const buildDir = 'build';
const distFile = `rooibosDist.brs`;
const fullDistPath = path.join(distDir, distFile);
const fs = require('fs');
const rmLines = require('gulp-rm-lines');
const cp = require('child_process');

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

  return gulp.src('./build/source/*.brs')
    .pipe(concat(distFile))
    .pipe(rmLines({
      'filters': [/^\s*'/i, /((\r\n|\n|\r)$)|(^(\r\n|\n|\r))|^\s*$/i]
    }))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(gulp.dest(distDir));
}

function copyToTests(cb) {
  const frameworkFile = path.join('frameworkTests/src/source/tests', distFile);
  if (fs.existsSync(frameworkFile)) {
    fs.unlinkSync(frameworkFile);
  }
  fs.copyFileSync(fullDistPath, frameworkFile);
  cb();
}

export function doc(cb) {
  let task = cp.exec('./node_modules/.bin/jsdoc -c jsdoc.json -t node_modules/minami -d docs');
  return task;
}

export function updateVersion(cb) {
  fs.writeFileSync("docs/version.txt", pkg.version);
  cb();
}

function insertVersionNumber(cb) {
  const filePath = path.join(buildDir, 'source', 'Rooibos.brs');
  let text = fs.readFileSync(filePath, 'utf8');
  text = text.replace('#ROOIBOS_VERSION#', pkg.version);
  fs.writeFileSync(filePath, text, 'utf8');
  cb();
}


export async function compile(cb) {
  let builder = new ProgramBuilder();

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


exports.build = series(clean, createDirectories, compile, insertVersionNumber, squash, copyToTests);
exports.dist = series(exports.build, doc, updateVersion);
