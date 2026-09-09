import type { BrsFile, BscFile, Program, XmlFile } from 'brighterscript';
import { Editor, standardizePath as s } from 'brighterscript';
import * as path from 'path';
import * as fs from 'fs';
import * as fastGlob from 'fast-glob';
import type { TestSuite } from './TestSuite';
import { RooibosLogPrefix } from '../utils/Diagnostics';

export class FileFactory {
    private coverageComponentXmlTemplate: string;
    private coverageComponentBrsTemplate: string;
    private frameworkSourcePath: string;

    constructor() {
        if (__filename.endsWith('.ts')) {
            //load the files directly from their source location. (i.e. the plugin is running as a typescript file from within ts-node)
            this.frameworkSourcePath = s`${__dirname}/../../../framework/src`;
        } else {
            //load the framework files from the dist folder (i.e. the plugin is running as a node_module)
            this.frameworkSourcePath = s`${__dirname}/../framework`;
        }

        this.coverageComponentXmlTemplate = fs.readFileSync(path.join(this.frameworkSourcePath, '/components/rooibos/CodeCoverage.xml'), 'utf8');
        this.coverageComponentBrsTemplate = fs.readFileSync(path.join(this.frameworkSourcePath, '/components/rooibos/CodeCoverage.brs'), 'utf8');
    }

    public sourceFilesToAutoImport: string[] = [];
    public addedFrameworkFiles: BscFile[] = [];

    public addFrameworkFiles(program: Program) {
        this.addedFrameworkFiles = [];
        let globedFiles = fastGlob.sync([
            '**/*.{bs,brs,xml}',
            '!**/bslib.brs',
            '!**/manifest',
            '**/CodeCoverage.{brs,xml}',
            '**/RooibosScene.xml'
        ], {
            cwd: this.frameworkSourcePath,
            absolute: false,
            followSymbolicLinks: true,
            onlyFiles: true
        });

        for (let filePath of globedFiles) {
            if (this.shouldAddFileToImportList(filePath)) {
                // Save a list of all source files added to the program
                // to be imported by node test components
                this.sourceFilesToAutoImport.push(filePath);
            }
            let sourcePath = path.resolve(this.frameworkSourcePath, filePath);
            let fileContents = fs.readFileSync(sourcePath, 'utf8').toString();
            let entry = { src: sourcePath, dest: filePath };
            this.addedFrameworkFiles.push(
                program.setFile(entry, fileContents)
            );
        }

        return this.addedFrameworkFiles;
    }

    public createTestXML(name: string, baseName: string, suite?: TestSuite): string {
        let scriptImports = [];
        for (let filePath of this.sourceFilesToAutoImport) {
            scriptImports.push(`<script type="text/brighterscript" uri="pkg:/${filePath}" />`);
        }

        // Add the test spec file rather then relying on auto imports
        if (suite) {
            scriptImports.push(`<script type="text/brighterscript" uri="pkg:/${suite.file.destPath.replace(/\\/g, '/')}" />`);
        }

        let contents = `<?xml version="1.0" encoding="UTF-8" ?>
            <component name="${name}" extends="${baseName}">
                ${scriptImports.join('\n')}
                <interface>
                    <field id="rooibosTestResult" type="assocarray"/>
                    <field id="testText" type="string" alias="statusLabel.text" />
                    <field id="failedText" type="string" alias="failedLabel.text" />
                    <field id="statusColor" type="string" alias="statusBackground.color" />
                    <function name='Rooibos_CreateTestNode' />
                </interface>

                <children>
                    <Rectangle id="statusBackground" color="#444444" width="1920" height="1080" />
                    <LayoutGroup translation="[960, 540]" vertAlignment="center"  horizAlignment="center">
                        <Label id="statusLabel" text='Rooibos is running tests' width="1800" />
                        <Label id="failedLabel" text="" translation="[0, 100]" width="1800" wrap="true" maxLines="15"/>
                    </LayoutGroup>
                </children>
            </component>
        `;
        return contents;
    }

    public createCoverageComponent(program: Program, coverageMap: any, filepathMap: Map<number, string>) {
        let template = this.coverageComponentBrsTemplate;
        template = template.replace(/\"\#EXPECTED_MAP\#\"/g, JSON.stringify(coverageMap ?? {}));
        template = template.replace(/\"\#FILE_PATH_MAP\#\"/g, JSON.stringify(filepathMap ?? {}));

        return [
            this.addGeneratedFile(program, 'components/rooibos/CodeCoverage.brs', template),
            this.addGeneratedFile(program, 'components/rooibos/CodeCoverage.xml', this.coverageComponentXmlTemplate)
        ].filter((f) => f !== undefined);
    }

    public isIgnoredFile(file: BrsFile | XmlFile): boolean {
        let name = file.pkgPath.toLowerCase();
        let result = this.addedFrameworkFiles.find((f) => {
            return name === f.pkgPath.toLowerCase();
        }
        );
        return result !== undefined;
    }

    private shouldAddFileToImportList(destFilePath): boolean {
        const pathDetails = path.parse(destFilePath);
        if (pathDetails.dir === 'source' || pathDetails.dir.startsWith('source\\') || pathDetails.dir.startsWith('source/')) {
            if (pathDetails.ext === '.brs' || (pathDetails.ext === '.bs' && !pathDetails.name.endsWith('.d'))) {
                return true;
            }
        }
        return false;
    }

    public addFile(program: Program, projectPathOrEntry: string | { src: string; dest: string }, contents: string) {
        let entry: { src: string; dest: string };
        if (typeof projectPathOrEntry === 'string') {
            entry = {
                src: path.resolve(projectPathOrEntry),
                dest: projectPathOrEntry
            };
        } else {
            entry = projectPathOrEntry;
        }
        try {
            //a rebuild re-registers the same path; reuse the existing srcPath so `setFile` replaces that
            //file instance instead of leaving two instances racing to write the same output file
            entry.src = program.getFile(entry.dest)?.srcPath ?? entry.src;

            const file = program.setFile(entry, contents);
            //files registered after the prepare phase never got an editor assigned, but the build's cleanup
            //calls `file.editor.undoAll()` on everything it built
            file.editor ??= new Editor();

            //replace any previous instance for this path so the list doesn't grow on every rebuild
            const existingIndex = this.addedFrameworkFiles.findIndex((f) => f.pkgPath === file.pkgPath);
            if (existingIndex >= 0) {
                this.addedFrameworkFiles[existingIndex] = file;
            } else {
                this.addedFrameworkFiles.push(file);
            }
            return file;
        } catch (error) {
            program.logger.error(RooibosLogPrefix, `Error adding framework file: ${entry.dest} : ${error.message}`);
        }
    }

    /**
     * Register a rooibos-generated file with the program, so brighterscript serializes and writes it as part
     * of the normal build lifecycle rather than rooibos writing it to disk itself.
     */
    public addGeneratedFile(program: Program, destPath: string, contents: string) {
        return this.addFile(program, { src: s`${program.options.rootDir}/${destPath}`, dest: destPath }, contents);
    }
}
