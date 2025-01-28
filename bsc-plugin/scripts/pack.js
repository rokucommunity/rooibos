var fsExtra = require('fs-extra');
var path = require('path');

var cachePath = path.join(__dirname, 'pack-cache.txt');
var packageJsonPath = path.join(__dirname, '../package.json');

var packageJson = fsExtra.readJsonSync(packageJsonPath);

//store the script and remove it from package.json
if (process.argv.includes('--pre')) {
    fsExtra.outputFileSync(cachePath, packageJson.scripts.postinstall);
    delete packageJson.scripts.postinstall;

    //restore the script
} else if (process.argv.includes('--post')) {
    packageJson.scripts.postinstall = fsExtra.readFileSync(cachePath, packageJson.scripts.postinstall).toString();
    fsExtra.removeSync(cachePath);
}

fsExtra.outputJsonSync(packageJsonPath, packageJson, { spaces: 4 });
