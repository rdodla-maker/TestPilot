import type { ILogger } from '@testpilot/contracts';
/**
 * Log level enum
 */
export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}
/**
 * Log entry structure
 */
export interface LogEntry {
    timestamp: Date;
    level: string;
    message: string;
    context?: Record<string, unknown>;
    error?: {
        message: string;
        stack?: string;
    };
}
/**
 * Simple structured logger
 */
export declare class Logger implements ILogger {
    private level;
    private format;
    constructor(level?: 'debug' | 'info' | 'warn' | 'error', format?: 'json' | 'text');
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
    private log;
    private output;
}
/**
 * Create a logger from configuration
 */
export declare function createLogger(level?: 'debug' | 'info' | 'warn' | 'error', format?: 'json' | 'text'): Logger;
//# sourceMappingURL=index.d.ts.map