import type { BrsFile, Program, XmlFile } from 'brighterscript';
import { standardizePath as s } from 'brighterscript';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';
import type { TestSuite } from './TestSuite';

export class FileFactory {
    private coverageComponentXmlTemplate: string;
    private coverageComponentBrsTemplate: string;

    constructor(
        private options?: {
            frameworkSourcePath?: string;
        }
    ) {
        this.options = this.options ?? {};
        if (!this.options.frameworkSourcePath) {
            if (__filename.endsWith('.ts')) {
                //load the files directly from their source location. (i.e. the plugin is running as a typescript file from within ts-node)
                this.options.frameworkSourcePath = s`${__dirname}/../../../../framework/src/source`;
            } else {
                //load the framework files from the dist folder (i.e. the plugin is running as a node_module)
                this.options.frameworkSourcePath = s`${__dirname}/../framework`;
            }
        }

        this.coverageComponentXmlTemplate = fs.readFileSync(path.join(this.options.frameworkSourcePath, 'CodeCoverage.xml'), 'utf8');
        this.coverageComponentBrsTemplate = fs.readFileSync(path.join(this.options.frameworkSourcePath, 'CodeCoverage.brs'), 'utf8');
    }

    private frameworkFileNames = [
        'BaseTestSuite',
        'CommonUtils',
        'Coverage',
        'Matchers',
        'Rooibos',
        'RuntimeConfig',
        'Stats',
        'Test',
        'TestGroup',
        'BaseTestReporter',
        'ConsoleTestReporter',
        'JUnitTestReporter',
        'TestResult',
        'TestRunner',
        'Utils'
    ];

    private targetPath = 'source/rooibos/';
    private targetCompsPath = 'components/rooibos/';
    public addedFrameworkFiles = [];

    public addFrameworkFiles(program: Program) {
        this.addedFrameworkFiles = [];
        for (let fileName of this.frameworkFileNames) {
            let sourcePath = path.resolve(path.join(this.options.frameworkSourcePath, `${fileName}.bs`));
            let fileContents = fs.readFileSync(sourcePath, 'utf8');
            let destPath = path.join(this.targetPath, `${fileName}.bs`);
            let entry = { src: sourcePath, dest: destPath };
            this.addFile(program, entry, fileContents);
        }

        this.addFile(
            program,
            { src: path.resolve(path.join(this.targetCompsPath, `RooibosScene.xml`)), dest: s`${this.targetCompsPath}/RooibosScene.xml` },
            this.createTestXML('RooibosScene', 'Scene')
        );
        return this.addedFrameworkFiles;
    }

    public createTestXML(name: string, baseName: string, suite?: TestSuite): string {
        let scriptImports = [];
        for (let fileName of this.frameworkFileNames) {
            scriptImports.push(`<script type="text/brighterscript" uri="pkg:/${this.targetPath}${fileName}.bs" />`);
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

        this.addFileToRootDir(program, path.join('components/rooibos', 'CodeCoverage.brs'), template);
        this.addFileToRootDir(program, path.join('components/rooibos', 'CodeCoverage.xml'), this.coverageComponentXmlTemplate);
    }

    public isIgnoredFile(file: BrsFile | XmlFile): boolean {
        let name = file.pkgPath.toLowerCase();
        let result = this.frameworkFileNames.find((f) => {
            return name === path.join(this.targetPath, `${f}.bs`).toLowerCase();
        }
        );
        return result !== undefined;
    }

    public addFile(program, projectPathOrEntry: string | { src: string; dest: string }, contents: string) {
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
            const file = program.setFile(entry, contents);
            this.addedFrameworkFiles.push(file);
            return file;
        } catch (error) {
            program.logger.error(`Error adding framework file: ${entry.dest} : ${error.message}`);
        }
    }

    public addFileToRootDir(program: Program, filePath: string, contents: string) {
        try {
            fse.outputFileSync(
                path.join(program.options.stagingDir ?? program.options.sourceRoot, filePath),
                contents
            );
        } catch (error) {
            program.logger.error(`Error adding framework file: ${path} : ${error.message}`);
        }
    }
}
