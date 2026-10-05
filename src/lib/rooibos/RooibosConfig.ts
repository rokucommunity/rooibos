
export enum RooibosLogLevel {
    error = 0,
    warning = 1,
    info = 2,
    verbose = 3
}

export interface RooibosConfig {
    isGlobalMethodMockingEfficientMode?: boolean;
    coverageExcludedFiles?: string[];
    /**
     * When true, the plugin instruments your code and the device reports coverage
     * counts at the end of the run. Defaults to false.
     */
    codeCoverage?: boolean;
    /**
     * @deprecated use `codeCoverage`. If both are set, `codeCoverage` wins.
     */
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

/**
 * Resolves the effective `codeCoverage` setting on a rooibos config, in place.
 * `codeCoverage` wins when defined; the deprecated `isRecordingCodeCoverage` is only a
 * fallback. The deprecated key is removed so the warning is emitted once per config load.
 */
export function normalizeCodeCoverage(config: RooibosConfig): RooibosConfig {
    const legacyValue = config.isRecordingCodeCoverage;
    if (legacyValue !== undefined) {
        if (config.codeCoverage === undefined) {
            console.warn('rooibos: `isRecordingCodeCoverage` is deprecated, use `codeCoverage` instead');
            config.codeCoverage = legacyValue;
        } else if (config.codeCoverage !== legacyValue) {
            console.warn('rooibos: `isRecordingCodeCoverage` is deprecated, use `codeCoverage` instead. Both are set and differ, so `codeCoverage` is being used');
        } else {
            console.warn('rooibos: `isRecordingCodeCoverage` is deprecated, use `codeCoverage` instead');
        }
        delete config.isRecordingCodeCoverage;
    }
    config.codeCoverage ??= false;
    return config;
}

/**
 * Builds the rooibos config the CLI hands to its internal build: the bsconfig `rooibos`
 * block with CLI overrides applied on top (entries whose value is undefined are ignored),
 * and deprecated keys resolved. Returns undefined when there is no bsconfig block and no
 * defined overrides.
 */
export function resolveCliRooibosConfig(bsconfigRooibos: RooibosConfig | undefined, overrides: Partial<RooibosConfig> = {}): RooibosConfig | undefined {
    const definedOverrides: Partial<RooibosConfig> = {};
    for (const [key, value] of Object.entries(overrides)) {
        if (value !== undefined) {
            definedOverrides[key] = value;
        }
    }
    if (!bsconfigRooibos && Object.keys(definedOverrides).length === 0) {
        return undefined;
    }
    return normalizeCodeCoverage({ ...bsconfigRooibos, ...definedOverrides });
}
