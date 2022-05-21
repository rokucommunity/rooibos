
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
    showOnlyFailures?: boolean;
    failFast?: boolean;
    printTestTimes?: boolean;
    printLcov?: boolean;
    port?: number;
    lineWidth?: number;
    includeFilters?: string[];
    tags?: string[];
    catchCrashes?: boolean;
    sendHomeOnFinish?: boolean;
    /**
     * The path to the folder where the rooibos framework roku files reside.
     * @default `dist/lib/framework`
     */
    frameworkSourcePath?: string;
}
