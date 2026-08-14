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
  allowLocalTargets: boolean;
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
  metadataLimits?: MetadataLimits;
  intelligenceLimits?: IntelligenceLimits;
}

export interface MetadataLimits {
  maxLinks: number;
  maxButtons: number;
  maxInputs: number;
  maxImages: number;
  maxHeadings: number;
  maxForms: number;
}

export interface IntelligenceLimits {
  maxPages: number;
  maxFeatures: number;
  maxWorkflows: number;
  maxRoles: number;
  maxRisks: number;
  maxEvidence: number;
  maxStringLength: number;
  maxSnapshotBytes: number;
}

/**
 * Load and validate configuration from environment
 */
export function loadConfig(): AppConfig {
  const env = process.env.NODE_ENV || 'development';

  return {
    environment: (env as any) || 'development',
    browser: {
      headless: process.env.BROWSER_HEADLESS !== 'false',
      timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000', 10),
      slowMo: parseInt(process.env.BROWSER_SLOW_MO || '0', 10),
      devtools: process.env.BROWSER_DEVTOOLS === 'true',
      allowLocalTargets: process.env.BROWSER_ALLOW_LOCAL_TARGETS === 'true',
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
      level: (process.env.LOG_LEVEL as any) || 'info',
      format: (process.env.LOG_FORMAT as any) || 'json',
    },
    metadataLimits: {
      maxLinks: parseInt(process.env.METADATA_MAX_LINKS || '500', 10),
      maxButtons: parseInt(process.env.METADATA_MAX_BUTTONS || '200', 10),
      maxInputs: parseInt(process.env.METADATA_MAX_INPUTS || '200', 10),
      maxImages: parseInt(process.env.METADATA_MAX_IMAGES || '500', 10),
      maxHeadings: parseInt(process.env.METADATA_MAX_HEADINGS || '200', 10),
      maxForms: parseInt(process.env.METADATA_MAX_FORMS || '50', 10),
    },
    intelligenceLimits: {
      maxPages: parseInt(process.env.INTELLIGENCE_MAX_PAGES || '50', 10),
      maxFeatures: parseInt(process.env.INTELLIGENCE_MAX_FEATURES || '100', 10),
      maxWorkflows: parseInt(process.env.INTELLIGENCE_MAX_WORKFLOWS || '50', 10),
      maxRoles: parseInt(process.env.INTELLIGENCE_MAX_ROLES || '25', 10),
      maxRisks: parseInt(process.env.INTELLIGENCE_MAX_RISKS || '50', 10),
      maxEvidence: parseInt(process.env.INTELLIGENCE_MAX_EVIDENCE || '500', 10),
      maxStringLength: parseInt(process.env.INTELLIGENCE_MAX_STRING_LENGTH || '500', 10),
      maxSnapshotBytes: parseInt(process.env.INTELLIGENCE_MAX_SNAPSHOT_BYTES || '200000', 10),
    },
  };
}

/**
 * Get browser configuration
 */
export function getBrowserConfig(): BrowserConfig {
  return loadConfig().browser;
}

export function getIntelligenceLimits(): IntelligenceLimits {
  return loadConfig().intelligenceLimits as IntelligenceLimits;
}
/**
 * Get orchestrator configuration
 */
export function getOrchestratorConfig(): OrchestratorConfig {
  return loadConfig().orchestrator;
}

/**
 * Get API configuration
 */
export function getApiConfig(): ApiConfig {
  return loadConfig().api;
}

/**
 * Get logging configuration
 */
export function getLoggingConfig(): LoggingConfig {
  return loadConfig().logging;
}

export function getMetadataLimits(): MetadataLimits {
  return loadConfig().metadataLimits as MetadataLimits;
}

/**
 * Create execution config from app config
 */
export function createExecutionConfig(appConfig: AppConfig): ExecutionConfig {
  return {
    timeout: appConfig.orchestrator.executionTimeoutMs,
    retryPolicy: {
      maxRetries: appConfig.orchestrator.maxRetries,
      backoffMultiplier: 2,
    },
  };
}
