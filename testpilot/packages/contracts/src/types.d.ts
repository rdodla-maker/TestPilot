/**
 * Common type definitions used across TestPilot contracts
 */
export type ExecutionId = string & {
    readonly __executionId: unique symbol;
};
export type ProjectId = string & {
    readonly __projectId: unique symbol;
};
export type WorkflowId = string & {
    readonly __workflowId: unique symbol;
};
export type AgentId = string & {
    readonly __agentId: unique symbol;
};
export type ToolId = string & {
    readonly __toolId: unique symbol;
};
export declare function createExecutionId(id: string): ExecutionId;
export declare function createProjectId(id: string): ProjectId;
export declare function createWorkflowId(id: string): WorkflowId;
export declare function createAgentId(id: string): AgentId;
export declare function createToolId(id: string): ToolId;
/**
 * Execution status enum
 */
export declare enum ExecutionStatus {
    Pending = "pending",
    Running = "running",
    Success = "success",
    Failed = "failed",
    Cancelled = "cancelled",
    Timeout = "timeout"
}
/**
 * Result status enum
 */
export declare enum ResultStatus {
    Success = "success",
    Failed = "failed",
    Cancelled = "cancelled"
}
/**
 * Metadata about an execution
 */
export interface ExecutionMetadata {
    startTime: Date;
    endTime?: Date;
    duration?: number;
    retryCount: number;
    [key: string]: unknown;
}
/**
 * Configuration passed to an agent or tool
 */
export interface ExecutionConfig {
    timeout?: number;
    retryPolicy?: {
        maxRetries: number;
        backoffMultiplier: number;
    };
    cancellationToken?: AbortSignal;
    [key: string]: unknown;
}
//# sourceMappingURL=types.d.ts.map