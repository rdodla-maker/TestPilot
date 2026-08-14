import { BaseWorkflow } from '@testpilot/core';
import type { ExecutionContext, WorkflowId, WorkflowInput } from '@testpilot/contracts';
import { WorkflowError, ResultStatus } from '@testpilot/contracts';
import { EnvironmentDiscoveryAgent } from '@testpilot/agents-environment-discovery';
import type { EnvironmentDiscoveryInput, EnvironmentDiscoveryOutput } from '@testpilot/agents-environment-discovery';

/**
 * Input to environment discovery workflow
 */
export interface EnvironmentDiscoveryWorkflowInput extends WorkflowInput {
  projectId: string;
  url: string;
  timeout?: number;
}

/**
 * Output from environment discovery workflow
 */
export interface EnvironmentDiscoveryWorkflowOutput {
  projectId: string;
  discovery: EnvironmentDiscoveryOutput;
}

/**
 * Environment Discovery Workflow
 * Orchestrates the environment discovery agent to collect initial application intelligence
 */
export class EnvironmentDiscoveryWorkflow extends BaseWorkflow<
  EnvironmentDiscoveryWorkflowInput,
  EnvironmentDiscoveryWorkflowOutput
> {
  private agent: EnvironmentDiscoveryAgent;

  constructor() {
    const id = 'environment-discovery-workflow' as WorkflowId;
    const name = 'Environment Discovery Workflow';
    const description =
      'Observes target web applications to collect initial raw evidence including HTML, screenshots, navigation details, and page metadata.';
    super(id, name, description);

    this.agent = new EnvironmentDiscoveryAgent();
  }

  protected async onExecute(
    input: EnvironmentDiscoveryWorkflowInput,
    context: ExecutionContext
  ): Promise<EnvironmentDiscoveryWorkflowOutput> {
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
      const agentInput: EnvironmentDiscoveryInput = {
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

      // Agent results are wrapped by BaseAgent (status + data). Check both wrapper and inner data
      if (
        agentResult.status === ResultStatus.Failed ||
        (agentResult.data && (agentResult.data as any).status === ResultStatus.Failed)
      ) {
        throw new WorkflowError(
          `Agent failed: ${agentResult.error?.message || (agentResult.data as any)?.error?.message}`,
          agentResult.error || (agentResult.data as any)?.error
        );
      }

      const discovery = (agentResult.data || agentResult) as any as EnvironmentDiscoveryOutput;

      return {
        projectId: input.projectId,
        discovery,
      };
    } catch (error) {
      context.logger.error('Environment Discovery Workflow failed', error as Error, {
        workflowId: this.id,
        projectId: input.projectId,
      });

      throw error;
    }
  }
}
