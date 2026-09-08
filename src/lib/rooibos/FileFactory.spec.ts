import type { Program } from 'brighterscript';
import { standardizePath as s } from 'brighterscript';
import { expect } from 'chai';
import * as fs from 'fs';
import { FileFactory } from './FileFactory';

describe('FileFactory', () => {
    describe('addFrameworkFiles', () => {
        let realExistsSync: typeof fs.existsSync;

        beforeEach(() => {
            realExistsSync = fs.existsSync;
        });

        afterEach(() => {
            (fs as any).existsSync = realExistsSync;
        });

        /**
         * A fresh clone that ran `npm install` (but not `ropm copy`) has no `roku_modules` folders, which
         * used to silently produce an incomplete framework and dozens of unrelated-looking test failures.
         */
        it('throws a helpful error when the ropm modules are missing', () => {
            const fileFactory = new FileFactory();

            //pretend the roku_modules folders were never copied in
            (fs as any).existsSync = (targetPath: fs.PathLike) => {
                if (`${targetPath}`.includes('roku_modules')) {
                    return false;
                }
                return realExistsSync(targetPath);
            };

            let error: Error;
            try {
                fileFactory.addFrameworkFiles({} as Program);
            } catch (e) {
                error = e as Error;
            }

            expect(error?.message).to.include('missing its ropm modules');
            expect(error?.message).to.include('npx ropm copy');
            //the message should name the folders it actually looked in
            expect(error?.message).to.include(s`/source/roku_modules`);
            expect(error?.message).to.include(s`/components/roku_modules`);
        });
    });
});
