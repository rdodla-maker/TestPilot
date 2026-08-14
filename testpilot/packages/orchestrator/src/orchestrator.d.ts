import type { IWorkflow, WorkflowInput, WorkflowResult, ILogger } from '@testpilot/contracts';
/**
 * Execution request for the orchestrator
 */
export interface ExecutionRequest<T extends WorkflowInput = WorkflowInput> {
    projectId: string;
    workflowId: string;
    input: T;
    config?: Partial<any>;
}
/**
 * Execution result from the orchestrator
 */
export interface ExecutionResponse<T = unknown> {
    executionId: string;
    projectId: string;
    workflowId: string;
    result: WorkflowResult<T>;
    duration: number;
}
/**
 * Minimal Orchestrator
 * Responsible for executing workflows with proper context and lifecycle management
 */
export declare class Orchestrator {
    private logger;
    private appConfig;
    constructor(logger?: ILogger);
    /**
     * Execute a workflow
     */
    execute<T extends WorkflowInput = WorkflowInput, R = unknown>(workflow: IWorkflow<T, R>, request: ExecutionRequest<T>): Promise<ExecutionResponse<R>>;
}
//# sourceMappingURL=orchestrator.d.ts.map