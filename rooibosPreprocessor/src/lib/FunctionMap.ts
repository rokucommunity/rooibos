import * as Debug from 'debug';

import FileDescriptor from './FileDescriptor';

const debug = Debug('FunctionMap');

interface IFunctionMap {
  [filename: string]: string[];
}

export default class FunctionMap {

  constructor() {
    this.functionRegex = '^(function|sub)\\s+(.*[^\\(])\\(';
    this.functionMaps = {};
  }

  private functionMaps: IFunctionMap;
  private functionRegex: string;

  /**
   * get the function map text for the given file
   * @param directory
   * @param filename
   * @param assoicatedFile
   */
  public processFile(fileDescriptor: FileDescriptor) {
    debug(`processing file `, fileDescriptor.fullPath);
    //brute force, get EVERY function declaration!
    const matches = this.getFunctionsMatchesValues(fileDescriptor.fileContents, this.functionRegex, 2);
    this.functionMaps[fileDescriptor.normalizedFileName] = matches;
    return matches;
  }

  private getFunctionsMatchesValues(input, pattern, groupIndex): string[] {
    let values = [];
    let matches: any[];
    const regex = new RegExp(pattern, 'gim');
    while (matches = regex.exec(input)) {
      values.push(matches[groupIndex]);
    }
    return values;
  }

  /**
   * getFunctionMapText
   * after processing of all the files, returns the block of code that contains all of the mapping functions
   * rooibos will later use.
   * @returns {string} text that contains the function maps, which rooibos needs for looking things up
   */
  public getFunctionMapText(): string {
    let text = this.createHeaderText();
    text += this.createGetFunctionsForFile();
    for (let filename in this.functionMaps) {
      text += this.createGetFunctionsMethod(filename, this.functionMaps[filename]);
    }
    return text;
  }

  public createGetFunctionsForFile() {
    let text = 'function RBSFM_getFunctionsForFile(filename)\n' +
      '  map = {\n';
    for (let filename in this.functionMaps) {
      text += `    "${filename}":RBSFM_getFunctions_${filename} \n`;
    }
    text +=	'  } \n' +
      '  return map[filename]\n' +
      'end function\n\n';

    return text;
  }

  public createGetFunctionsMethod(filename: string, functionNames: string[]): string {
    let text = `function RBSFM_getFunctions_${filename}()\n` +
      '  return {\n';
    functionNames.forEach((functionName) => {
      text += `    "${functionName}":${functionName} \n`;
    });
    text +=	'  } \n\n' +
      'end function\n\n';
    return text;
  }

  public createHeaderText(): string {
    return `
    '***************************************************
    'Function maps
    '***************************************************
    `;
  }

}
