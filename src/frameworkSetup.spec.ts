import { standardizePath as s } from 'brighterscript';
import * as fsExtra from 'fs-extra';

/**
 * The framework depends on ropm modules (i.e. `rooibos_promises`) that `ropm copy` copies into
 * `framework/src`. `npm install` alone doesn't do that, so a fresh clone builds the framework with an
 * incomplete file set and ~60 specs fail for reasons that look completely unrelated.
 *
 * This runs at import time (not inside an `it`) and aborts the process, so we bail out with something
 * actionable rather than letting the rest of the suite fail confusingly.
 */
const missing = ['source', 'components']
    .map(folder => s`${__dirname}/../framework/src/${folder}/roku_modules`)
    .filter(modulePath => !fsExtra.existsSync(modulePath));

if (missing.length > 0) {
    console.error(
        `\nIt looks like there are no roku_modules (expected at ${missing.join(', ')}).\n` +
        `Did you forget to run \`npx ropm copy\`? (\`npm run build\` runs it for you too.)\n`
    );
    process.exit(1);
}
