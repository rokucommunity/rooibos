const path = require('path');
const ProgramBuilder = require('brighterscript').ProgramBuilder;

let programBuilder = new ProgramBuilder();
programBuilder.run({
  // project: path.join(__dirname, '../', 'test-project', 'bsconfig.json')
  project: path.join('/home/george/hope/open-source/maestro/swerve-app', 'bsconfig-test.json')
}).catch(e => {
  console.error(e);
});