import type { ExecutionContext, IWorkflow, WorkflowInput, WorkflowResult, WorkflowId, ResultStatus } from '@testpilot/contracts';
/**
 * Base class for all workflows
 * Implements the IWorkflow interface with common lifecycle and result management
 */
export declare abstract class BaseWorkflow<Input extends WorkflowInput = WorkflowInput, Output = unknown> implements IWorkflow<Input, Output> {
    readonly id: WorkflowId;
    readonly name: string;
    readonly description: string;
    constructor(id: WorkflowId, name: string, description: string);
    /**
     * Execute the workflow
     */
    execute(input: Input, context: ExecutionContext): Promise<WorkflowResult<Output>>;
    /**
     * Override in subclass to implement workflow logic
     */
    protected abstract onExecute(input: Input, context: ExecutionContext): Promise<Output>;
    /**
     * Helper to record a workflow step
     */
    protected recordStep(steps: Array<{
        name: string;
        status: ResultStatus;
        duration: number;
    }>, name: string, status: ResultStatus, duration: number): void;
    /**
     * Helper to create a successful result
     */
    protected createSuccessResult(output: Output, startTime: Date, endTime: Date, steps: Array<{
        name: string;
        status: ResultStatus;
        duration: number;
    }>): WorkflowResult<Output>;
    /**
     * Helper to create an error result
     */
    protected createErrorResult(error: Error, startTime: Date, endTime: Date, steps: Array<{
        name: string;
        status: ResultStatus;
        duration: number;
    }>): WorkflowResult<Output>;
    /**
     * Helper to create a cancelled result
     */
    protected createCancelledResult(startTime: Date, endTime: Date, steps: Array<{
        name: string;
        status: ResultStatus;
        duration: number;
    }>): WorkflowResult<Output>;
}
//# sourceMappingURL=base-workflow.d.ts.map