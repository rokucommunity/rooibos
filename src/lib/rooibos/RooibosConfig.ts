
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
     * console at the end of the run (human-readable extra). The rooibos CLI builds its
     * reports from the condensed counts stream, which is always emitted when
     * `isRecordingCodeCoverage` is on, so this flag is not needed for CLI-generated
     * reports.
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
