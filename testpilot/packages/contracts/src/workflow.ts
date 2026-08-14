import type { ExecutionContext } from './execution-context';
import type { WorkflowId, ResultStatus } from './types';

/**
 * Input to a workflow
 */
export interface WorkflowInput {
  [key: string]: unknown;
}

/**
 * Result returned by a workflow
 */
export interface WorkflowResult<T = unknown> {
  /**
   * Execution succeeded or failed
   */
  status: ResultStatus;

  /**
   * Main output data
   */
  data?: T;

  /**
   * Error if status is Failed
   */
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };

  /**
   * Metadata about workflow execution
   */
  metadata: {
    startTime: Date;
    endTime: Date;
    duration: number;
    executionId: string;
    steps?: Array<{
      name: string;
      status: ResultStatus;
      duration: number;
    }>;
    [key: string]: unknown;
  };
}

/**
 * Generic workflow contract
 * Workflows coordinate multiple agents and tools
 */
export interface IWorkflow<Input extends WorkflowInput = WorkflowInput, Output = unknown> {
  /**
   * Unique identifier for this workflow
   */
  id: WorkflowId;

  /**
   * Human-readable name
   */
  name: string;

  /**
   * Detailed description of workflow's purpose
   */
  description: string;

  /**
   * Execute the workflow with given input
   */
  execute(input: Input, context: ExecutionContext): Promise<WorkflowResult<Output>>;
}
