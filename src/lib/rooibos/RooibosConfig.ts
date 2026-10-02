
export enum RooibosLogLevel {
    error = 0,
    warning = 1,
    info = 2,
    verbose = 3
}

export interface RooibosConfig {
    isGlobalMethodMockingEfficientMode?: boolean;
    coverageExcludedFiles?: string[];
    isRecordingCodeCoverage?: boolean;
    isGlobalMethodMockingEnabled?: boolean;
    globalMethodMockingExcludedFiles?: string[];
    logLevel?: RooibosLogLevel;
    showOnlyFailures?: boolean;
    failFast?: boolean;
    printTestTimes?: boolean;
    /**
     * When true, the device also prints a plain, spec-compliant lcov report to the
     * console at the end of the run.
     * @deprecated will be removed in a future major version. Use the rooibos CLI
     * instead, which always writes `lcov.info`, `coverage-final.json`, and an HTML
     * report into `--coverage-dir` from the condensed counts stream.
     */
    printLcov?: boolean;
    port?: number;
    lineWidth?: number;
    includeFilters?: string[];
    tags?: string[];
    catchCrashes?: boolean;
    colorizeOutput?: boolean;
    throwOnFailedAssertion?: boolean;
    sendHomeOnFinish?: boolean;

    /**
     * @deprecated Use the `reporters` array instead
     */
    reporter?: string;
    reporters?: string[];
    keepAppOpen?: boolean;
    testSceneName?: string;

    /**
     * How long (in milliseconds) to sleep before exiting the app when `keepAppOpen` is false,
     * to give the IO/telnet connection time to finish sending all the logs. Defaults to 400.
     */
    shutdownDelay?: number;
}
