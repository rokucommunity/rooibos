
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
    /**
     * Complexity budget for a single expression once coverage instrumentation is added.
     * Roku's compiler raises "Internal limit size exceeded" (&hae) when one statement's
     * expression gets too complex (measured empirically: a plain or-chain dies at 29
     * operators; a flat or-chain of calls at 22). Expressions whose projected
     * post-instrumentation complexity exceeds this budget get progressively less
     * instrumentation (branch wraps dropped first, then the condition line wrap)
     * instead of breaking the build. Default 16.
     */
    coverageMaxExpressionComplexity?: number;
    /**
     * If/elseif chains longer than this are restructured every N arms (`else if c`
     * becomes `else : if c`), which is semantically identical but starts a fresh chain
     * so the compiler's per-chain arm cap (~260 arms once instrumented) is never hit.
     * Default 150.
     */
    coverageMaxIfChainArms?: number;
    /**
     * Roku refuses to load .brs files of 2MiB or more (&hb9). Files whose projected
     * post-instrumentation size exceeds this many bytes fall back to function-level
     * coverage only. Default 1900000.
     */
    coverageMaxFileBytes?: number;
    isGlobalMethodMockingEnabled?: boolean;
    globalMethodMockingExcludedFiles?: string[];
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
}
