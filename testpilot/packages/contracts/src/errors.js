/**
 * Application error codes
 */
export var ErrorCode;
(function (ErrorCode) {
    // Validation errors
    ErrorCode["InvalidInput"] = "INVALID_INPUT";
    ErrorCode["InvalidUrl"] = "INVALID_URL";
    ErrorCode["InvalidConfiguration"] = "INVALID_CONFIGURATION";
    // Browser errors
    ErrorCode["BrowserLaunchFailed"] = "BROWSER_LAUNCH_FAILED";
    ErrorCode["NavigationFailed"] = "NAVIGATION_FAILED";
    ErrorCode["NavigationTimeout"] = "NAVIGATION_TIMEOUT";
    ErrorCode["PageCrashed"] = "PAGE_CRASHED";
    ErrorCode["ScreenshotFailed"] = "SCREENSHOT_FAILED";
    // Network errors
    ErrorCode["NetworkError"] = "NETWORK_ERROR";
    ErrorCode["DnsResolutionFailed"] = "DNS_RESOLUTION_FAILED";
    ErrorCode["SslError"] = "SSL_ERROR";
    ErrorCode["ConnectionRefused"] = "CONNECTION_REFUSED";
    ErrorCode["Timeout"] = "TIMEOUT";
    // Tool errors
    ErrorCode["ToolExecutionFailed"] = "TOOL_EXECUTION_FAILED";
    ErrorCode["ToolNotFound"] = "TOOL_NOT_FOUND";
    // Agent errors
    ErrorCode["AgentExecutionFailed"] = "AGENT_EXECUTION_FAILED";
    ErrorCode["AgentNotFound"] = "AGENT_NOT_FOUND";
    ErrorCode["AgentCancelled"] = "AGENT_CANCELLED";
    // Workflow errors
    ErrorCode["WorkflowExecutionFailed"] = "WORKFLOW_EXECUTION_FAILED";
    ErrorCode["WorkflowNotFound"] = "WORKFLOW_NOT_FOUND";
    // System errors
    ErrorCode["InternalServerError"] = "INTERNAL_SERVER_ERROR";
    ErrorCode["NotImplemented"] = "NOT_IMPLEMENTED";
})(ErrorCode || (ErrorCode = {}));
/**
 * Application error with code and message
 */
export class ApplicationError extends Error {
    code;
    details;
    timestamp;
    constructor(code, message, details) {
        super(message);
        this.name = 'ApplicationError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
        Object.setPrototypeOf(this, ApplicationError.prototype);
    }
    toJSON() {
        return {
            name: this.name,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
        };
    }
}
/**
 * Validation error
 */
export class ValidationError extends ApplicationError {
    constructor(message, details) {
        super(ErrorCode.InvalidInput, message, details);
        this.name = 'ValidationError';
        Object.setPrototypeOf(this, ValidationError.prototype);
    }
}
/**
 * Browser error
 */
export class BrowserError extends ApplicationError {
    constructor(code, message, details) {
        super(code, message, details);
        this.name = 'BrowserError';
        Object.setPrototypeOf(this, BrowserError.prototype);
    }
}
/**
 * Network error
 */
export class NetworkError extends ApplicationError {
    constructor(code, message, details) {
        super(code, message, details);
        this.name = 'NetworkError';
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}
/**
 * Tool error
 */
export class ToolError extends ApplicationError {
    constructor(message, details) {
        super(ErrorCode.ToolExecutionFailed, message, details);
        this.name = 'ToolError';
        Object.setPrototypeOf(this, ToolError.prototype);
    }
}
/**
 * Agent error
 */
export class AgentError extends ApplicationError {
    constructor(code, message, details) {
        super(code, message, details);
        this.name = 'AgentError';
        Object.setPrototypeOf(this, AgentError.prototype);
    }
}
/**
 * Workflow error
 */
export class WorkflowError extends ApplicationError {
    constructor(message, details) {
        super(ErrorCode.WorkflowExecutionFailed, message, details);
        this.name = 'WorkflowError';
        Object.setPrototypeOf(this, WorkflowError.prototype);
    }
}
//# sourceMappingURL=errors.js.map