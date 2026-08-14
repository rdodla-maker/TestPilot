import { ResultStatus as StatusEnum } from '@testpilot/contracts';
/**
 * Base class for all workflows
 * Implements the IWorkflow interface with common lifecycle and result management
 */
export class BaseWorkflow {
    id;
    name;
    description;
    constructor(id, name, description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
    /**
     * Execute the workflow
     */
    async execute(input, context) {
        const startTime = new Date();
        const steps = [];
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
            return this.createSuccessResult(output, startTime, endTime, steps);
        }
        catch (error) {
            const endTime = new Date();
            const duration = endTime.getTime() - startTime.getTime();
            context.logger.error(`Workflow ${this.name} failed`, error, {
                workflowId: this.id,
                executionId: context.executionId,
                duration,
            });
            return this.createErrorResult(error, startTime, endTime, steps);
        }
    }
    /**
     * Helper to record a workflow step
     */
    recordStep(steps, name, status, duration) {
        steps.push({ name, status, duration });
    }
    /**
     * Helper to create a successful result
     */
    createSuccessResult(output, startTime, endTime, steps) {
        return {
            status: StatusEnum.Success,
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
    createErrorResult(error, startTime, endTime, steps) {
        const code = error.code || 'WORKFLOW_EXECUTION_FAILED';
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
                steps,
            },
        };
    }
    /**
     * Helper to create a cancelled result
     */
    createCancelledResult(startTime, endTime, steps) {
        return {
            status: StatusEnum.Cancelled,
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
        };
    }
}
//# sourceMappingURL=base-workflow.js.map