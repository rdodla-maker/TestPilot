import type { ILogger } from '@testpilot/contracts';

/**
 * Log level enum
 */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
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
export class Logger implements ILogger {
  private level: LogLevel;
  private format: 'json' | 'text';

  constructor(level: 'debug' | 'info' | 'warn' | 'error' = 'info', format: 'json' | 'text' = 'json') {
    const levelMap = { debug: LogLevel.Debug, info: LogLevel.Info, warn: LogLevel.Warn, error: LogLevel.Error };
    this.level = levelMap[level];
    this.format = format;
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Debug) {
      this.log(LogLevel.Debug, message, context);
    }
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Info) {
      this.log(LogLevel.Info, message, context);
    }
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Warn) {
      this.log(LogLevel.Warn, message, context);
    }
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (this.level <= LogLevel.Error) {
      const logEntry: LogEntry = {
        timestamp: new Date(),
        level: 'error',
        message,
        context,
        error: error ? { message: error.message, stack: error.stack } : undefined,
      };
      this.output(logEntry);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const levelMap = { [LogLevel.Debug]: 'debug', [LogLevel.Info]: 'info', [LogLevel.Warn]: 'warn', [LogLevel.Error]: 'error' };
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: levelMap[level],
      message,
      context,
    };
    this.output(logEntry);
  }

  private output(entry: LogEntry): void {
    if (this.format === 'json') {
      console.log(JSON.stringify(entry));
    } else {
      const timestamp = entry.timestamp.toISOString();
      const level = entry.level.toUpperCase();
      const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
      const errorStr = entry.error ? `\n  ${entry.error.message}\n  ${entry.error.stack}` : '';
      console.log(`[${timestamp}] ${level}: ${entry.message}${contextStr}${errorStr}`);
    }
  }
}

/**
 * Create a logger from configuration
 */
export function createLogger(level: 'debug' | 'info' | 'warn' | 'error' = 'info', format: 'json' | 'text' = 'json'): Logger {
  return new Logger(level, format);
}
