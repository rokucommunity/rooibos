import type { BrsFile, Program, XmlFile } from 'brighterscript';
import { standardizePath as s } from 'brighterscript';
import * as path from 'path';
import * as fs from 'fs';

export class FileFactory {

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
            this.addedFrameworkFiles.push(
                program.setFile(entry, fileContents)
            );
        }

        let entry = {
            src: s`${this.options.frameworkSourcePath}/RooibosScene.xml`,
            dest: s`${this.targetCompsPath}/RooibosScene.xml`
        };
        this.addedFrameworkFiles.push(
            program.setFile(entry, this.createTestXML('TestsScene', 'Scene'))
        );
    }

    public createTestXML(name: string, baseName: string, useBs = true): string {
        let scriptImports = [];
        for (let fileName of this.frameworkFileNames) {
            scriptImports.push(`<script type="text/bright${useBs ? 'er' : ''}script" uri="pkg:/${this.targetPath}${fileName}.${useBs ? 'bs' : 'brs'}" />`);
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
                    <Label id="statusLabel" text='Rooibos is running tests' />
                    <Label id="failedLabel" text="" translation="[0, 100]" width="1800" wrap="true" maxLines="15"/>
                </children>
            </component>
        `;
        return contents;
    }

    public createCoverageComponent(coverageMap: any, filepathMap: Map<number, string>) {
        //TODO - replace text with appropriate values
        // let targetPath = path.resolve(this._program.options.rootDir);
        // let file = new File(path.resolve(path.join(targetPath), 'components'), 'components', 'CodeCoverage.xml', '.xml');
        // file.setFileContents(this.coverageComponentXmlTemplate);
        //`Writing to ${file.fullPath}`);
        // file.saveFileContents();

        // file = new File(path.resolve(path.join(targetPath, 'components')), 'components', 'CodeCoverage.brs', '.brs');
        // let template = this.coverageComponentBrsTemplate;
        // template = template.replace(/\#EXPECTED_MAP\#/g, JSON.stringify(this.expectedCoverageMap));
        // template = template.replace(/\#FILE_PATH_MAP\#/g, JSON.stringify(this.filePathMap));
        // file.setFileContents(template);
        //`Writing to ${file.fullPath}`);
        // file.saveFileContents();
    }

    public isIgnoredFile(file: BrsFile | XmlFile): boolean {
        let name = file.pkgPath.toLowerCase();
        let result = this.frameworkFileNames.find((f) => {
            return name === path.join(this.targetPath, `${f}.bs`).toLowerCase();
        }
        );
        return result !== undefined;
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

}
