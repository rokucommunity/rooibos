/**
 * Dev-only sanity check, wired into mocha's `require` list.
 *
 * The framework depends on ropm modules (i.e. `rooibos_promises`) that get copied into
 * `framework/src` by `ropm copy` - a step only `npm run build` performs. A fresh clone that
 * runs `npm install && npm test` therefore has no `roku_modules` folders, and the framework
 * silently builds with an incomplete file set, surfacing as dozens of unrelated-looking
 * test failures. Fail fast with something actionable instead.
 */
const fs = require('fs');
const path = require('path');

const frameworkSrc = path.join(__dirname, '..', 'framework', 'src');

const missing = ['source', 'components']
    .map(folder => path.join(frameworkSrc, folder, 'roku_modules'))
    .filter(modulePath => !fs.existsSync(modulePath));

if (missing.length > 0) {
    const relative = missing.map(x => path.relative(path.join(__dirname, '..'), x));
    console.error(
        `\nIt looks like there are no roku_modules (expected at ${relative.join(', ')}).\n` +
        `Did you forget to run \`npx ropm copy\`? (\`npm run build\` runs it for you too.)\n`
    );
    process.exit(1);
}
