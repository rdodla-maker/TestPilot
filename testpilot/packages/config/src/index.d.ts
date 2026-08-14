/**
 * Configuration management for TestPilot
 * All environment variables are validated and exposed through this module
 */
import type { ExecutionConfig } from '@testpilot/contracts';
/**
 * Browser configuration
 */
export interface BrowserConfig {
    headless: boolean;
    timeout: number;
    slowMo: number;
    devtools: boolean;
}
/**
 * Orchestrator configuration
 */
export interface OrchestratorConfig {
    maxRetries: number;
    retryDelayMs: number;
    executionTimeoutMs: number;
}
/**
 * API configuration
 */
export interface ApiConfig {
    host: string;
    port: number;
    corsOrigins: string[];
    requestTimeoutMs: number;
}
/**
 * Logging configuration
 */
export interface LoggingConfig {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
}
/**
 * Global configuration
 */
export interface AppConfig {
    environment: 'development' | 'staging' | 'production';
    browser: BrowserConfig;
    orchestrator: OrchestratorConfig;
    api: ApiConfig;
    logging: LoggingConfig;
}
/**
 * Load and validate configuration from environment
 */
export declare function loadConfig(): AppConfig;
/**
 * Get browser configuration
 */
export declare function getBrowserConfig(): BrowserConfig;
/**
 * Get orchestrator configuration
 */
export declare function getOrchestratorConfig(): OrchestratorConfig;
/**
 * Get API configuration
 */
export declare function getApiConfig(): ApiConfig;
/**
 * Get logging configuration
 */
export declare function getLoggingConfig(): LoggingConfig;
/**
 * Create execution config from app config
 */
export declare function createExecutionConfig(appConfig: AppConfig): ExecutionConfig;
//# sourceMappingURL=index.d.ts.map