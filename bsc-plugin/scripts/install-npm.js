/**
 * Installs a local version of all the rokucommunity dependent packages into this project
 */

import * as fsExtra from 'fs-extra';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as rimraf from 'rimraf';

//set the cwd to the root of this project
let thisProjectRootPath = path.join(__dirname, '..');
process.chdir(thisProjectRootPath);

rimraf.sync(path.join('node_modules/brighterscript'));
if (fsExtra.existsSync('package-lock.json')) {
    fsExtra.rmSync('package-lock.json');
}
console.log('install packages');
childProcess.execSync('npm i brighterscript@latest --save-dev', {
    stdio: 'inherit'
});
