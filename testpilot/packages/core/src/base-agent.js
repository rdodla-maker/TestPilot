import { ResultStatus as StatusEnum } from '@testpilot/contracts';
/**
 * Base class for all agents
 * Implements the IAgent interface with common lifecycle and result management
 */
export class BaseAgent {
    id;
    name;
    description;
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
    /**
     * Execute the agent
     */
    async execute(input, context) {
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
            return this.createSuccessResult(output, startTime, endTime);
        }
        catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            context.logger.error(`Agent ${this.name} failed`, error, {
                agentId: this.id,
                executionId: context.executionId,
                duration,
            });
            return this.createErrorResult(error, startTime, endTime);
        }
    }
    /**
     * Helper to create a successful result
     */
    createSuccessResult(output, startTime, endTime) {
        return {
            status: StatusEnum.Success,
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
    createErrorResult(error, startTime, endTime) {
        const code = error.code || 'AGENT_EXECUTION_FAILED';
        return {
            status: StatusEnum.Failed,
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
        };
    }
    /**
     * Helper to create a cancelled result
     */
    createCancelledResult(startTime) {
        const endTime = new Date();
        return {
            status: StatusEnum.Cancelled,
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
//# sourceMappingURL=base-agent.js.map