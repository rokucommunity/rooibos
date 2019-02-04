import FileDescriptor from './FileDescriptor';
import { ItGroup } from './ItGroup';

export class TestSuite {

  constructor() {
    this.name = '';
    this.isValid = false;
    this.hasFailures = false;
    this.hasSoloTests = false;
    this.hasIgnoredTests = false;
    this.hasSoloGroups = false;
    this.isSolo = false;
    this.isIgnored = false;
    this.itGroups = [];
    this.setupFunctionName = '';
    this.tearDownFunctionName = '';
    this.isNodeTest = false;
    this.nodeTestFileName = '';
  }

  public filePath: string;
  public name: string;
  public isNodeTest: boolean;
  public isSolo: boolean;
  public isIgnored: boolean;
  public isValid: boolean;

  public itGroups: ItGroup[];
  public hasFailures: boolean;
  public hasSoloTests: boolean;
  public hasIgnoredTests: boolean;
  public hasSoloGroups: boolean;
  public setupFunctionName: string;
  public tearDownFunctionName: string;
  public beforeEachFunctionName: string;
  public nodeTestFileName: string;
  public afterEachFunctionName: string;
  public rawParams: string;

  public asJson(): object {
    return {
      name: this.name,
      filePath: this.filePath,
      valid: this.isValid,
      hasFailures: this.hasFailures,
      hasSoloTests: this.hasSoloTests,
      hasIgnoredTests: this.hasIgnoredTests,
      hasSoloGroups: this.hasSoloGroups,
      isSolo: this.isSolo,
      isIgnored: this.isIgnored,
      itGroups: this.itGroups.map((itGroup) => itGroup.asJson()),
      setupFunctionName: this.setupFunctionName,
      tearDownFunctionName: this.tearDownFunctionName,
      isNodeTest: this.isNodeTest,
      nodeTestFileName: this.nodeTestFileName,
      beforeEachFunctionName: this.beforeEachFunctionName,
      afterEachFunctionName: this.afterEachFunctionName,
    };
  }
}
