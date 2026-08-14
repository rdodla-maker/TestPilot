import type {
  ExecutionContext,
  IWorkflow,
  WorkflowInput,
  WorkflowResult,
  WorkflowId,
  ResultStatus,
} from '@testpilot/contracts';
import { ResultStatus as StatusEnum } from '@testpilot/contracts';

/**
 * Base class for all workflows
 * Implements the IWorkflow interface with common lifecycle and result management
 */
export abstract class BaseWorkflow<Input extends WorkflowInput = WorkflowInput, Output = unknown>
  implements IWorkflow<Input, Output>
{
  readonly id: WorkflowId;
  readonly name: string;
  readonly description: string;

  constructor(id: WorkflowId, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * Execute the workflow
   */
  async execute(input: Input, context: ExecutionContext): Promise<WorkflowResult<Output>> {
    const startTime = new Date();
    const steps: Array<{ name: string; status: ResultStatus; duration: number }> = [];

    context.logger.info(`Workflow ${this.name} started`, {
      workflowId: this.id,
      executionId: context.executionId,
    });

    try {
      // Check cancellation
      if (context.cancellationToken?.aborted) {
        const endTime = new Date();
        return this.createCancelledResult(startTime, endTime, steps);
      }

      // Execute the workflow's main logic
      const output = await this.onExecute(input, context);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      context.logger.info(`Workflow ${this.name} completed successfully`, {
        workflowId: this.id,
        executionId: context.executionId,
        duration,
      });

      return this.createSuccessResult(output as Output, startTime, endTime, steps);
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      context.logger.error(`Workflow ${this.name} failed`, error as Error, {
        workflowId: this.id,
        executionId: context.executionId,
        duration,
      });

      return this.createErrorResult(error as Error, startTime, endTime, steps);
    }
  }

  /**
   * Override in subclass to implement workflow logic
   */
  protected abstract onExecute(input: Input, context: ExecutionContext): Promise<Output>;

  /**
   * Helper to record a workflow step
   */
  protected recordStep(
    steps: Array<{ name: string; status: ResultStatus; duration: number }>,
    name: string,
    status: ResultStatus,
    duration: number
  ): void {
    steps.push({ name, status, duration });
  }

  /**
   * Helper to create a successful result
   */
  protected createSuccessResult(
    output: Output,
    startTime: Date,
    endTime: Date,
    steps: Array<{ name: string; status: ResultStatus; duration: number }>
  ): WorkflowResult<Output> {
    return {
      status: StatusEnum.Success as ResultStatus,
      data: output,
      metadata: {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        executionId: 'unknown',
        steps,
      },
    };
  }

  /**
   * Helper to create an error result
   */
  protected createErrorResult(
    error: Error,
    startTime: Date,
    endTime: Date,
    steps: Array<{ name: string; status: ResultStatus; duration: number }>
  ): WorkflowResult<Output> {
    const code = (error as any).code || 'WORKFLOW_EXECUTION_FAILED';
    return {
      status: StatusEnum.Failed as ResultStatus,
      error: {
        code,
        message: error.message,
      },
      metadata: {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        executionId: 'unknown',
        steps,
      },
    } as WorkflowResult<Output>;
  }

  /**
   * Helper to create a cancelled result
   */
  protected createCancelledResult(
    startTime: Date,
    endTime: Date,
    steps: Array<{ name: string; status: ResultStatus; duration: number }>
  ): WorkflowResult<Output> {
    return {
      status: StatusEnum.Cancelled as ResultStatus,
      error: {
        code: 'WORKFLOW_CANCELLED',
        message: 'Workflow execution was cancelled',
      },
      metadata: {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        executionId: 'unknown',
        steps,
      },
    } as WorkflowResult<Output>;
  }
}
