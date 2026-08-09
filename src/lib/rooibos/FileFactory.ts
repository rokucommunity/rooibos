import type { BrsFile, BscFile, Program, XmlFile } from 'brighterscript';
import { standardizePath as s } from 'brighterscript';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import * as fastGlob from 'fast-glob';
import type { TestSuite } from './TestSuite';

export class FileFactory {
    private coverageComponentXmlTemplate;
    private coverageComponentBrsTemplate;
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
            '!**/RooibosScene.xml'
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

        let entry = {
            src: s`${this.frameworkSourcePath}/components/RooibosScene.xml`,
            dest: s`components/rooibos/RooibosScene.xml`
        };
        this.addedFrameworkFiles.push(
            program.setFile(entry, this.createTestXML('RooibosScene', 'Scene'))
        );
    }

    public createTestXML(name: string, baseName: string, suite?: TestSuite): string {
        let scriptImports = [];
        for (let filePath of this.sourceFilesToAutoImport) {
            scriptImports.push(`<script type="text/brighterscript" uri="pkg:/${filePath}" />`);
        }

        // Add the test spec file rather then relying on auto imports
        if (suite) {
            scriptImports.push(`<script type="text/brighterscript" uri="pkg:/${suite.file.pkgPath.replace(/\\/g, '/')}" />`);
        }

        // Node-test components run offscreen and don't need the visual UI.
        // Emitting it here would also create duplicate scene-graph IDs
        // (e.g. multiple `resultImage` BusySpinners), which corrupts the
        // SceneGraph state and crashes the runtime at end of run.
        if (suite) {
            return `<?xml version="1.0" encoding="UTF-8" ?>
            <component name="${name}" extends="${baseName}">
                ${scriptImports.join('\n')}
                <interface>
                    <field id="rooibosTestResult" type="assocarray"/>
                    <function name='Rooibos_CreateTestNode' />
                </interface>
            </component>
        `;
        }

        let contents = `<?xml version="1.0" encoding="UTF-8" ?>
            <component name="${name}" extends="${baseName}">
                ${scriptImports.join('\n')}
                <interface>
                    <field id="rooibosTestResult" type="assocarray"/>
                    <field id="testText" type="string" alias="statusLabel.text" />
                    <field id="summaryText" type="string" alias="summaryLabel.text" />
                    <field id="progressWidth" type="float" alias="progressFill.width" />
                    <field id="statusColor" type="string" alias="statusBackground.color" />
                    <function name='Rooibos_CreateTestNode' />
                </interface>

                <children>
                    <Rectangle id="statusBackground" color="#1a1a2e" width="1920" height="1080" />

                    <Poster uri="pkg:/images/rooibos/your-company-logo.png" width="113" height="62" translation="[1167, 658]" />

                    <LayoutGroup id="contentGroup" translation="[640, 25]" horizAlignment="center" itemSpacings="[20]">
                        <Group id="resultImage">
                            <BusySpinner id="resultSpinner" uri="pkg:/images/rooibos/loading.png" spinInterval="2" control="start" />
                            <Poster id="resultPoster" width="75" height="75" scale="[0, 0]" />
                        </Group>

                        <LayoutGroup itemSpacings="[4]" horizAlignment="center">
                            <Label id="statusLabel" text=""
                                   width="500" height="36" horizAlign="center" color="#ffffff"
                                   font="font:MediumBoldSystemFont" />

                            <Label id="statusCounts" text=""
                                   width="500" height="22" horizAlign="center" color="#aaaabb"
                                   font="font:SmallestBoldSystemFont" />
                        </LayoutGroup>

                        <Rectangle color="#00000000" width="500" height="8">
                            <Rectangle id="progressBg" color="#333355" width="500" height="8" />
                            <Rectangle id="progressFill" color="#6c63ff" width="0" height="8" />
                        </Rectangle>

                        <Rectangle color="#444466" width="500" height="1" />

                        <RooibosScrollableResults id="resultsLabel"
                               itemSize="[500, 22]"
                               vertFocusAnimationStyle="floatingFocus"
                               numRows="17" />

                        <Rectangle color="#444466" width="500" height="1" />

                        <Label id="summaryLabel" text=""
                               width="500" height="30" horizAlign="center" color="#888899"
                               font="font:SmallestSystemFont" />
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

        this.addFileToRootDir(program, path.join('components/rooibos', 'CodeCoverage.brs'), template);
        this.addFileToRootDir(program, path.join('components/rooibos', 'CodeCoverage.xml'), this.coverageComponentXmlTemplate);
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

    public addFile(program, projectPath: string, contents: string) {
        try {
            const file = program.setFile({
                src: path.resolve(projectPath),
                dest: projectPath
            }, contents);
            this.addedFrameworkFiles.push(file);
            return file;
        } catch (error) {
            console.error(`Error adding framework file: ${projectPath} : ${error.message}`);
        }
    }

    public addFileToRootDir(program: Program, filePath: string, contents: string) {
        try {
            fse.outputFileSync(
                path.join(program.options.stagingFolderPath ?? program.options.stagingDir ?? program.options.sourceRoot, filePath),
                contents
            );
        } catch (error) {
            console.error(`Error adding framework file: ${path} : ${error.message}`);
        }
    }

    public copyImageAssets(program: Program) {
        let imageFiles = fastGlob.sync(['images/**/*.{png,jpg,jpeg,gif}'], {
            cwd: this.frameworkSourcePath,
            absolute: false,
            onlyFiles: true
        });
        for (let imgPath of imageFiles) {
            let srcPath = path.resolve(this.frameworkSourcePath, imgPath);
            let destPath = path.join(
                program.options.stagingFolderPath ?? program.options.stagingDir ?? program.options.sourceRoot,
                imgPath
            );
            fse.copySync(srcPath, destPath);
        }
    }
}
