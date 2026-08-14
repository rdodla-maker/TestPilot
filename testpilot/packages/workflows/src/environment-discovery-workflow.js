import { BaseWorkflow } from '@testpilot/core';
import { WorkflowError, ResultStatus } from '@testpilot/contracts';
import { EnvironmentDiscoveryAgent } from '@testpilot/agents-environment-discovery';
/**
 * Environment Discovery Workflow
 * Orchestrates the environment discovery agent to collect initial application intelligence
 */
export class EnvironmentDiscoveryWorkflow extends BaseWorkflow {
    agent;
    constructor() {
        const id = 'environment-discovery-workflow';
        const name = 'Environment Discovery Workflow';
        const description = 'Observes target web applications to collect initial raw evidence including HTML, screenshots, navigation details, and page metadata.';
        super(id, name, description);
        this.agent = new EnvironmentDiscoveryAgent();
    }
    async onExecute(input, context) {
        context.logger.info('Environment Discovery Workflow started', {
            workflowId: this.id,
            projectId: input.projectId,
            url: input.url,
        });
        try {
            // Validate input
            if (!input.projectId || !input.url) {
                throw new WorkflowError('Project ID and URL are required', { input });
            }
            // Prepare agent input
            const agentInput = {
                projectId: input.projectId,
                url: input.url,
                timeout: input.timeout,
            };
            context.logger.debug('Executing Environment Discovery Agent', {
                projectId: input.projectId,
                url: input.url,
            });
            // Execute agent
            const agentResult = await this.agent.execute(agentInput, context);
            context.logger.info('Environment Discovery Agent completed', {
                status: agentResult.status,
                projectId: input.projectId,
            });
            if (agentResult.status === ResultStatus.Failed) {
                throw new WorkflowError(`Agent failed: ${agentResult.error?.message}`, agentResult.error);
            }
            const discovery = agentResult;
            return {
                projectId: input.projectId,
                discovery,
            };
        }
        catch (error) {
            context.logger.error('Environment Discovery Workflow failed', error, {
                workflowId: this.id,
                projectId: input.projectId,
            });
            throw error;
        }
    }
}
//# sourceMappingURL=environment-discovery-workflow.js.map