import { createExecutionId, createProjectId, createWorkflowId } from '@testpilot/contracts';
import { createLogger } from '@testpilot/observability';
import { createExecutionConfig } from '@testpilot/config';
import { loadConfig } from '@testpilot/config';
/**
 * Minimal Orchestrator
 * Responsible for executing workflows with proper context and lifecycle management
 */
export class Orchestrator {
    logger;
    appConfig;
    constructor(logger) {
        this.logger = logger || createLogger('info', 'json');
        this.appConfig = loadConfig();
    }
    /**
     * Execute a workflow
     */
    async execute(workflow, request) {
        const executionId = createExecutionId(`exec-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
        const projectId = createProjectId(request.projectId);
        const workflowId = createWorkflowId(request.workflowId);
        const startTime = Date.now();
        this.logger.info('Orchestrator execution started', {
            executionId,
            projectId: request.projectId,
            workflowId: request.workflowId,
        });
        try {
            // Create execution context
            const context = {
                executionId,
                projectId,
                workflowId,
                goal: `Execute ${workflow.name}`,
                config: createExecutionConfig(this.appConfig),
                logger: this.logger,
                metadata: request.config,
            };
            // Execute workflow
            const result = await workflow.execute(request.input, context);
            const duration = Date.now() - startTime;
            this.logger.info('Orchestrator execution completed', {
                executionId,
                projectId: request.projectId,
                status: result.status,
                duration,
            });
            return {
                executionId,
                projectId: request.projectId,
                workflowId: request.workflowId,
                result,
                duration,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error('Orchestrator execution failed', error, {
                executionId,
                projectId: request.projectId,
                duration,
            });
            throw error;
        }
    }
}
//# sourceMappingURL=orchestrator.js.map