import type { ExecutionId, ProjectId, WorkflowId, ExecutionConfig } from './types';
/**
 * Logger interface for structured logging
 */
export interface ILogger {
    debug(message: string, context?: Record<string, unknown>): void;
    info(message: string, context?: Record<string, unknown>): void;
    warn(message: string, context?: Record<string, unknown>): void;
    error(message: string, error?: Error, context?: Record<string, unknown>): void;
}
/**
 * ExecutionContext provides stable foundation for agents and tools
 * Contains everything needed to execute, log, and trace work
 */
export interface ExecutionContext {
    /**
     * Unique identifier for this execution
     */
    executionId: ExecutionId;
    /**
     * Project being tested
     */
    projectId: ProjectId;
    /**
     * Workflow being executed
     */
    workflowId?: WorkflowId;
    /**
     * High-level goal or objective
     */
    goal?: string;
    /**
     * Configuration for this execution
     */
    config: ExecutionConfig;
    /**
     * Structured logger
     */
    logger: ILogger;
    /**
     * Cancellation signal
     */
    cancellationToken?: AbortSignal;
    /**
     * Additional metadata
     */
    metadata?: Record<string, unknown>;
}
//# sourceMappingURL=execution-context.d.ts.map