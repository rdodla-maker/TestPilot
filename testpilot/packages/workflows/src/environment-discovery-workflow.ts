import { BaseWorkflow } from '@testpilot/core';
import type { ExecutionContext, WorkflowId, WorkflowInput } from '@testpilot/contracts';
import { WorkflowError, ResultStatus } from '@testpilot/contracts';
import { EnvironmentDiscoveryAgent } from '@testpilot/agents-environment-discovery';
import type { EnvironmentDiscoveryInput, EnvironmentDiscoveryOutput } from '@testpilot/agents-environment-discovery';
import { ApplicationUnderstandingAgent, buildApplicationIntelligenceSnapshot } from '@testpilot/agents-application-understanding';
import type { ApplicationUnderstandingResult, ApplicationUnderstandingRequest, ApplicationIntelligenceSnapshot } from '@testpilot/contracts';
import { createDefaultApplicationProfileService, type ApplicationProfileService, type IntelligenceSnapshotRecord } from '@testpilot/database';

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
  understanding?: ApplicationUnderstandingResult;
  intelligence?: ApplicationIntelligenceSnapshot;
  persistence?: {
    status: 'persisted' | 'failed';
    applicationId: string;
    snapshotId?: string;
    snapshotVersion?: number;
  };
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
  private understandingAgent: ApplicationUnderstandingAgent;
  private profileService: ApplicationProfileService;

  constructor(profileService?: ApplicationProfileService) {
    const id = 'environment-discovery-workflow' as WorkflowId;
    const name = 'Environment Discovery Workflow';
    const description =
      'Observes target web applications to collect initial raw evidence including HTML, screenshots, navigation details, and page metadata.';
    super(id, name, description);

    this.agent = new EnvironmentDiscoveryAgent();
    this.understandingAgent = new ApplicationUnderstandingAgent();
    this.profileService = profileService || createDefaultApplicationProfileService();
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

      // Call Application Understanding agent with Level 1.2 evidence
      if (!discovery.applicationMetadata) {
        throw new WorkflowError('Application metadata was not produced by environment discovery');
      }

      const understandingRequest: ApplicationUnderstandingRequest = {
        projectId: input.projectId,
        applicationMetadata: discovery.applicationMetadata,
        environmentObservation: discovery.observation,
      };

      const understandingRes = await this.understandingAgent.execute(understandingRequest as any, context as any);
      const understanding = (understandingRes && (understandingRes as any).data?.result) as ApplicationUnderstandingResult | undefined;
      if (!understanding) {
        throw new WorkflowError('Application understanding was not produced');
      }

      const intelligenceStartedAt = Date.now();
      context.logger.info('Application intelligence generation started', {
        executionId: context.executionId,
        schemaVersion: '1.0',
      });
      let intelligence: ApplicationIntelligenceSnapshot;
      try {
        intelligence = buildApplicationIntelligenceSnapshot({
          projectId: input.projectId,
          sourceExecutionId: context.executionId,
          metadata: discovery.applicationMetadata,
          understanding,
        });
      } catch (error) {
        context.logger.error('Application intelligence validation failed', error as Error, {
          executionId: context.executionId,
          schemaVersion: '1.0',
          validation: 'failed',
        });
        throw error;
      }
      context.logger.info('Application intelligence generation completed', {
        executionId: context.executionId,
        schemaVersion: intelligence.schemaVersion,
        durationMs: Date.now() - intelligenceStartedAt,
        validation: 'passed',
        pages: intelligence.pages.length,
        roles: intelligence.roles.length,
        features: intelligence.features.length,
        workflows: intelligence.workflows.length,
        risks: intelligence.risks.length,
        evidence: intelligence.evidence.length,
        snapshotBytes: Buffer.byteLength(JSON.stringify(intelligence)),
        truncated: intelligence.truncated,
      });
      if (intelligence.truncated) {
        context.logger.warn('Application intelligence snapshot truncated', {
          executionId: context.executionId,
          schemaVersion: intelligence.schemaVersion,
          truncation: intelligence.truncation,
        });
      }

      context.logger.info('Application intelligence persistence started', {
        executionId: context.executionId,
        applicationId: input.projectId,
      });
      await this.profileService.createOrUpdateProfile({
        id: input.projectId,
        name: intelligence.application.name.value,
        targetUrls: intelligence.pages.map((page) => page.url),
      });
      let persisted: IntelligenceSnapshotRecord;
      try {
        persisted = await this.profileService.persistSnapshot(input.projectId, context.executionId, intelligence);
      } catch (error) {
        context.logger.error('Application intelligence persistence failed', error as Error, {
          executionId: context.executionId,
          applicationId: input.projectId,
        });
        throw error;
      }
      context.logger.info('Application intelligence persistence completed', {
        executionId: context.executionId,
        applicationId: input.projectId,
        snapshotId: persisted.id,
        snapshotVersion: persisted.snapshotVersion,
        snapshotBytes: persisted.metadata.snapshotBytes,
      });

      return {
        projectId: input.projectId,
        discovery,
        understanding,
        intelligence,
        persistence: {
          status: 'persisted',
          applicationId: input.projectId,
          snapshotId: persisted.id,
          snapshotVersion: persisted.snapshotVersion,
        },
      } as any;
    } catch (error) {
      context.logger.error('Environment Discovery Workflow failed', error as Error, {
        workflowId: this.id,
        projectId: input.projectId,
      });

      throw error;
    }
  }
}
