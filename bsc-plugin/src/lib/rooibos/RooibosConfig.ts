
export enum RooibosLogLevel {
  error = 0,
  warning = 1,
  info = 2,
  verbose = 3
}

export interface RooibosConfig {
  coverageSourceFilePattern?: string[];
  isRecordingCodeCoverage?: boolean;
  logLevel?: RooibosLogLevel;
  showFailuresOnly?: boolean;
  failFast?: boolean;
  printTestTimes?: boolean;
  printLcov?: boolean;
  port?: number;
}
