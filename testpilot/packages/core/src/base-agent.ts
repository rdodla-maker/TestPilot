import type {
  ExecutionContext,
  IAgent,
  AgentInput,
  AgentResult,
  AgentId,
  ResultStatus,
} from '@testpilot/contracts';
import { ResultStatus as StatusEnum } from '@testpilot/contracts';

/**
 * Base class for all agents
 * Implements the IAgent interface with common lifecycle and result management
 */
export abstract class BaseAgent<Input extends AgentInput = AgentInput, Output = unknown>
  implements IAgent<Input, Output>
{
  readonly id: AgentId;
  readonly name: string;
  readonly description: string;

  constructor(id: AgentId, name: string, description: string) {
    this.id = id;
    this.name = name;
    this.description = description;
  }

  /**
   * Execute the agent
   */
  async execute(input: Input, context: ExecutionContext): Promise<AgentResult<Output>> {
    const startTime = new Date();

    context.logger.info(`Agent ${this.name} started`, {
      agentId: this.id,
      executionId: context.executionId,
    });

    try {
      // Check cancellation
      if (context.cancellationToken?.aborted) {
        return this.createCancelledResult(startTime);
      }

      // Execute the agent's main logic
      const output = await this.onExecute(input, context);

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      context.logger.info(`Agent ${this.name} completed successfully`, {
        agentId: this.id,
        executionId: context.executionId,
        duration,
      });

      return this.createSuccessResult(output as Output, startTime, endTime);
    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      context.logger.error(`Agent ${this.name} failed`, error as Error, {
        agentId: this.id,
        executionId: context.executionId,
        duration,
      });

      return this.createErrorResult(error as Error, startTime, endTime);
    }
  }

  /**
   * Override in subclass to implement agent logic
   */
  protected abstract onExecute(input: Input, context: ExecutionContext): Promise<Output>;

  /**
   * Helper to create a successful result
   */
  protected createSuccessResult(output: Output, startTime: Date, endTime: Date): AgentResult<Output> {
    return {
      status: StatusEnum.Success as ResultStatus,
      data: output,
      metadata: {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        executionId: 'unknown', // Will be set by caller if needed
      },
    };
  }

  /**
   * Helper to create an error result
   */
  protected createErrorResult(error: Error, startTime: Date, endTime: Date): AgentResult<Output> {
    const code = (error as any).code || 'AGENT_EXECUTION_FAILED';
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
      },
    } as AgentResult<Output>;
  }

  /**
   * Helper to create a cancelled result
   */
  protected createCancelledResult(startTime: Date): AgentResult<Output> {
    const endTime = new Date();
    return {
      status: StatusEnum.Cancelled as ResultStatus,
      error: {
        code: 'AGENT_CANCELLED',
        message: 'Agent execution was cancelled',
      },
      metadata: {
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        executionId: 'unknown',
      },
    };
  }
}
