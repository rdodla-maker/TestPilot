/**
 * Application error codes
 */
export enum ErrorCode {
  // Validation errors
  InvalidInput = 'INVALID_INPUT',
  InvalidUrl = 'INVALID_URL',
  InvalidConfiguration = 'INVALID_CONFIGURATION',

  // Browser errors
  BrowserLaunchFailed = 'BROWSER_LAUNCH_FAILED',
  NavigationFailed = 'NAVIGATION_FAILED',
  NavigationTimeout = 'NAVIGATION_TIMEOUT',
  PageCrashed = 'PAGE_CRASHED',
  ScreenshotFailed = 'SCREENSHOT_FAILED',

  // Network errors
  NetworkError = 'NETWORK_ERROR',
  DnsResolutionFailed = 'DNS_RESOLUTION_FAILED',
  SslError = 'SSL_ERROR',
  ConnectionRefused = 'CONNECTION_REFUSED',
  Timeout = 'TIMEOUT',

  // Tool errors
  ToolExecutionFailed = 'TOOL_EXECUTION_FAILED',
  ToolNotFound = 'TOOL_NOT_FOUND',

  // Agent errors
  AgentExecutionFailed = 'AGENT_EXECUTION_FAILED',
  AgentNotFound = 'AGENT_NOT_FOUND',
  AgentCancelled = 'AGENT_CANCELLED',

  // Workflow errors
  WorkflowExecutionFailed = 'WORKFLOW_EXECUTION_FAILED',
  WorkflowNotFound = 'WORKFLOW_NOT_FOUND',

  // System errors
  InternalServerError = 'INTERNAL_SERVER_ERROR',
  NotImplemented = 'NOT_IMPLEMENTED',
}

/**
 * Application error with code and message
 */
export class ApplicationError extends Error {
  readonly code: ErrorCode;
  readonly details?: unknown;
  readonly timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    details?: unknown
  ) {
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
  constructor(message: string, details?: unknown) {
    super(ErrorCode.InvalidInput, message, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Browser error
 */
export class BrowserError extends ApplicationError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'BrowserError';
    Object.setPrototypeOf(this, BrowserError.prototype);
  }
}

/**
 * Network error
 */
export class NetworkError extends ApplicationError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Tool error
 */
export class ToolError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.ToolExecutionFailed, message, details);
    this.name = 'ToolError';
    Object.setPrototypeOf(this, ToolError.prototype);
  }
}

/**
 * Agent error
 */
export class AgentError extends ApplicationError {
  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(code, message, details);
    this.name = 'AgentError';
    Object.setPrototypeOf(this, AgentError.prototype);
  }
}

/**
 * Workflow error
 */
export class WorkflowError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.WorkflowExecutionFailed, message, details);
    this.name = 'WorkflowError';
    Object.setPrototypeOf(this, WorkflowError.prototype);
  }
}
