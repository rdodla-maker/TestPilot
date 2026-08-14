/**
 * Application error codes
 */
export declare enum ErrorCode {
    InvalidInput = "INVALID_INPUT",
    InvalidUrl = "INVALID_URL",
    InvalidConfiguration = "INVALID_CONFIGURATION",
    BrowserLaunchFailed = "BROWSER_LAUNCH_FAILED",
    NavigationFailed = "NAVIGATION_FAILED",
    NavigationTimeout = "NAVIGATION_TIMEOUT",
    PageCrashed = "PAGE_CRASHED",
    ScreenshotFailed = "SCREENSHOT_FAILED",
    NetworkError = "NETWORK_ERROR",
    DnsResolutionFailed = "DNS_RESOLUTION_FAILED",
    SslError = "SSL_ERROR",
    ConnectionRefused = "CONNECTION_REFUSED",
    Timeout = "TIMEOUT",
    ToolExecutionFailed = "TOOL_EXECUTION_FAILED",
    ToolNotFound = "TOOL_NOT_FOUND",
    AgentExecutionFailed = "AGENT_EXECUTION_FAILED",
    AgentNotFound = "AGENT_NOT_FOUND",
    AgentCancelled = "AGENT_CANCELLED",
    WorkflowExecutionFailed = "WORKFLOW_EXECUTION_FAILED",
    WorkflowNotFound = "WORKFLOW_NOT_FOUND",
    InternalServerError = "INTERNAL_SERVER_ERROR",
    NotImplemented = "NOT_IMPLEMENTED"
}
/**
 * Application error with code and message
 */
export declare class ApplicationError extends Error {
    readonly code: ErrorCode;
    readonly details?: unknown;
    readonly timestamp: Date;
    constructor(code: ErrorCode, message: string, details?: unknown);
    toJSON(): {
        name: string;
        code: ErrorCode;
        message: string;
        details: unknown;
        timestamp: Date;
    };
}
/**
 * Validation error
 */
export declare class ValidationError extends ApplicationError {
    constructor(message: string, details?: unknown);
}
/**
 * Browser error
 */
export declare class BrowserError extends ApplicationError {
    constructor(code: ErrorCode, message: string, details?: unknown);
}
/**
 * Network error
 */
export declare class NetworkError extends ApplicationError {
    constructor(code: ErrorCode, message: string, details?: unknown);
}
/**
 * Tool error
 */
export declare class ToolError extends ApplicationError {
    constructor(message: string, details?: unknown);
}
/**
 * Agent error
 */
export declare class AgentError extends ApplicationError {
    constructor(code: ErrorCode, message: string, details?: unknown);
}
/**
 * Workflow error
 */
export declare class WorkflowError extends ApplicationError {
    constructor(message: string, details?: unknown);
}
//# sourceMappingURL=errors.d.ts.map