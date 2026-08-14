/**
 * Log level enum
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Debug"] = 0] = "Debug";
    LogLevel[LogLevel["Info"] = 1] = "Info";
    LogLevel[LogLevel["Warn"] = 2] = "Warn";
    LogLevel[LogLevel["Error"] = 3] = "Error";
})(LogLevel || (LogLevel = {}));
/**
 * Simple structured logger
 */
export class Logger {
    level;
    format;
    constructor(level = 'info', format = 'json') {
        const levelMap = { debug: LogLevel.Debug, info: LogLevel.Info, warn: LogLevel.Warn, error: LogLevel.Error };
        this.level = levelMap[level];
        this.format = format;
    }
    debug(message, context) {
        if (this.level <= LogLevel.Debug) {
            this.log(LogLevel.Debug, message, context);
        }
    }
    info(message, context) {
        if (this.level <= LogLevel.Info) {
            this.log(LogLevel.Info, message, context);
        }
    }
    warn(message, context) {
        if (this.level <= LogLevel.Warn) {
            this.log(LogLevel.Warn, message, context);
        }
    }
    error(message, error, context) {
        if (this.level <= LogLevel.Error) {
            const logEntry = {
                timestamp: new Date(),
                level: 'error',
                message,
                context,
                error: error ? { message: error.message, stack: error.stack } : undefined,
            };
            this.output(logEntry);
        }
    }
    log(level, message, context) {
        const levelMap = { [LogLevel.Debug]: 'debug', [LogLevel.Info]: 'info', [LogLevel.Warn]: 'warn', [LogLevel.Error]: 'error' };
        const logEntry = {
            timestamp: new Date(),
            level: levelMap[level],
            message,
            context,
        };
        this.output(logEntry);
    }
    output(entry) {
        if (this.format === 'json') {
            console.log(JSON.stringify(entry));
        }
        else {
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
export function createLogger(level = 'info', format = 'json') {
    return new Logger(level, format);
}
//# sourceMappingURL=index.js.map