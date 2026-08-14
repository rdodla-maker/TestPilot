/**
 * Configuration management for TestPilot
 * All environment variables are validated and exposed through this module
 */
/**
 * Load and validate configuration from environment
 */
export function loadConfig() {
    const env = process.env.NODE_ENV || 'development';
    return {
        environment: env || 'development',
        browser: {
            headless: process.env.BROWSER_HEADLESS !== 'false',
            timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
            slowMo: parseInt(process.env.BROWSER_SLOW_MO || '0', 10),
            devtools: process.env.BROWSER_DEVTOOLS === 'true',
        },
        orchestrator: {
            maxRetries: parseInt(process.env.ORCHESTRATOR_MAX_RETRIES || '3', 10),
            retryDelayMs: parseInt(process.env.ORCHESTRATOR_RETRY_DELAY_MS || '1000', 10),
            executionTimeoutMs: parseInt(process.env.ORCHESTRATOR_TIMEOUT_MS || '60000', 10),
        },
        api: {
            host: process.env.API_HOST || 'localhost',
            port: parseInt(process.env.API_PORT || '3000', 10),
            corsOrigins: (process.env.API_CORS_ORIGINS || 'http://localhost:3001').split(','),
            requestTimeoutMs: parseInt(process.env.API_REQUEST_TIMEOUT_MS || '30000', 10),
        },
        logging: {
            level: process.env.LOG_LEVEL || 'info',
            format: process.env.LOG_FORMAT || 'json',
        },
    };
}
/**
 * Get browser configuration
 */
export function getBrowserConfig() {
    return loadConfig().browser;
}
/**
 * Get orchestrator configuration
 */
export function getOrchestratorConfig() {
    return loadConfig().orchestrator;
}
/**
 * Get API configuration
 */
export function getApiConfig() {
    return loadConfig().api;
}
/**
 * Get logging configuration
 */
export function getLoggingConfig() {
    return loadConfig().logging;
}
/**
 * Create execution config from app config
 */
export function createExecutionConfig(appConfig) {
    return {
        timeout: appConfig.orchestrator.executionTimeoutMs,
        retryPolicy: {
            maxRetries: appConfig.orchestrator.maxRetries,
            backoffMultiplier: 2,
        },
    };
}
//# sourceMappingURL=index.js.map