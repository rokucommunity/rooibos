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
  files: ['source/**/*.*'],
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
  var banner = [`/**`,
    ` * ${pkg.name} - ${pkg.description}`,
    ` * @version v${pkg.version}`,
    ` * @link ${pkg.homepage}`,
    ` * @license ${pkg.license}`,
    ` */`,
    ``].join(`\n`);

  return gulp.src('./src/*.brs')
    .pipe(header(banner, { pkg: pkg }))
    .pipe(concat(distFile))
    .pipe(rmLines({
      'filters': [/^\s*'/i, /((\r\n|\n|\r)$)|(^(\r\n|\n|\r))|^\s*$/i]
    }))
    .pipe(gulp.dest(distDir));
}

function copyToSamples(cb) {
  fs.copyFile(fullDistPath, path.join('source/tests', distFile), cb);
  fs.copyFile(fullDistPath, path.join('samples/Overview/source/tests', distFile), cb);
  fs.copyFile(fullDistPath, path.join('samples/nonEvalSample/source/tests', distFile), cb);
}

/**
 * This target is used for CI
 */
export async function sendFrameworkTestsToDevice(cb) {
  await rokuDeploy.prepublishToStaging(args);
  console.log('wtf1');
  let task = cp.exec('rooibosC p out/.roku-deploy-staging/tests');
  task.stdout.pipe(process.stdout)
  task.on('exit', async function() {
    console.log('wtf4');
    await rokuDeploy.zipPackage(args);
    await rokuDeploy.publish(args);
  })
}

// export async function executeTests(cb) {
//   const args = {
//     host: '192.168.16.3',
//     password: 'aaaa',
//     rootDir: 'source',
//     outDir: outDir
//   };
//   await rokuDeploy.prepublishToStaging(args);
//   // await rokuDeploy.zipPackage(args);
//   // await rokuDeploy.publish(args);
//   cb();
// }

exports.build = series(clean, createDirectories, squash, copyToSamples);
exports.runFrameworkTests = series(exports.build, sendFrameworkTestsToDevice)