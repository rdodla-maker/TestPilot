import { BaseAgent } from '@testpilot/core';
import type { ExecutionContext, AgentId } from '@testpilot/contracts';
import { AgentError, ErrorCode, ResultStatus } from '@testpilot/contracts';
import { BrowserTool, extractMetadataFromObservation } from '@testpilot/tools-browser';
import { getMetadataLimits } from '@testpilot/config';
import type { EnvironmentDiscoveryInput, EnvironmentDiscoveryOutput, EnvironmentObservation } from './types';

/**
 * Environment Discovery Agent
 * Mission: Observe a target web application and collect reliable raw evidence
 */
export class EnvironmentDiscoveryAgent extends BaseAgent<EnvironmentDiscoveryInput, EnvironmentDiscoveryOutput> {
  private browserTool: BrowserTool;

  constructor() {
    const id = 'environment-discovery-agent' as AgentId;
    const name = 'Environment Discovery Agent';
    const description = 'Observes target web applications and collects reliable raw evidence including HTML, screenshots, navigation details, and page metadata.';
    super(id, name, description);

    this.browserTool = new BrowserTool();
  }

  protected async onExecute(
    input: EnvironmentDiscoveryInput,
    context: ExecutionContext
  ): Promise<EnvironmentDiscoveryOutput> {
    context.logger.info('Environment Discovery Agent starting', {
      agentId: this.id,
      projectId: input.projectId,
      url: input.url,
    });

    const executionStartTime = Date.now();

    try {
      // Validate input
      if (!input.projectId || typeof input.projectId !== 'string') {
        throw new AgentError(
          ErrorCode.InvalidInput,
          'Project ID is required and must be a string',
          { input }
        );
      }

      if (!input.url || typeof input.url !== 'string') {
        throw new AgentError(
          ErrorCode.InvalidInput,
          'URL is required and must be a string',
          { input }
        );
      }

      context.logger.debug('Input validation passed', { projectId: input.projectId });

      // Use browser tool to observe page
      context.logger.info('Initiating page observation', { url: input.url });
      context.logger.info('BrowserTool.execute about to be called', { tool: 'BrowserTool', executionId: context.executionId });
      console.info(JSON.stringify({ event: 'agent.browserTool.execute.start', agent: this.id, executionId: context.executionId, url: input.url, timestamp: new Date().toISOString() }));

      const toolResult = await this.browserTool.execute(
        {
          url: input.url,
          timeout: input.timeout || 30000,
          captureScreenshot: true,
          captureHtml: true,
        },
        context
      );

      if (!toolResult.success) {
        context.logger.warn('BrowserTool.execute returned failure', { error: toolResult.error });
        console.info(JSON.stringify({ event: 'agent.browserTool.execute.failed', agent: this.id, executionId: context.executionId, error: toolResult.error, timestamp: new Date().toISOString() }));
        throw new AgentError(
          ErrorCode.ToolExecutionFailed,
          `Browser tool failed: ${toolResult.error?.message}`,
          toolResult.error
        );
      }

      if (!toolResult.output) {
        throw new AgentError(
          ErrorCode.ToolExecutionFailed,
          'Browser tool returned no output'
        );
      }

      const browserOutput = toolResult.output as any;
      const observation = browserOutput.observation;
      // Diagnostic: confirm observation shape before extraction
      console.info(JSON.stringify({ event: 'agent.afterObservation', agent: this.id, executionId: context.executionId, title: observation?.title || null, finalUrl: observation?.finalUrl || null, htmlLength: (observation?.html || '').length, timestamp: new Date().toISOString() }));

      // Transform to agent output
      const environmentObservation: EnvironmentObservation = {
        projectId: input.projectId,
        requestedUrl: observation.requestedUrl,
        finalUrl: observation.finalUrl,
        title: observation.title,
        browserInfo: {
          name: 'chromium',
          version: 'latest',
          headless: true,
        },
        viewport: observation.viewport,
        html: observation.html,
        screenshot: observation.screenshot,
        navigationStatus: observation.navigationStatus,
        loadDuration: observation.loadDuration,
        timestamp: observation.timestamp,
      };

      // Perform deterministic metadata extraction (level 1.2)
      let applicationMetadata: any = undefined;
      try {
        const limits = getMetadataLimits();
        // Diagnostic: confirm extractor exists and input shape (no sensitive content)
        console.info(JSON.stringify({ event: 'agent.extractor.call.start', agent: this.id, executionId: context.executionId, url: observation.finalUrl, title: observation.title || null, htmlLength: (observation.html || '').length, extractorType: typeof extractMetadataFromObservation, timestamp: new Date().toISOString() }));
        // Call extractor
        applicationMetadata = extractMetadataFromObservation(observation, limits as any);
        // Diagnostic: report summary/truncated and presence
        console.info(JSON.stringify({ event: 'agent.extractor.call.end', agent: this.id, executionId: context.executionId, summary: applicationMetadata?.summary || null, truncated: applicationMetadata?.truncated || false, hasResult: !!applicationMetadata, timestamp: new Date().toISOString() }));
        context.logger.info('Metadata extraction completed', { counts: applicationMetadata?.summary });
      } catch (metaErr) {
        context.logger.warn('Metadata extraction failed', { error: (metaErr as Error).message });
        console.info(JSON.stringify({ event: 'agent.extractor.call.error', agent: this.id, executionId: context.executionId, error: (metaErr as Error).message, extractorType: typeof extractMetadataFromObservation, timestamp: new Date().toISOString() }));
      }

      const executionTime = Date.now() - executionStartTime;

      context.logger.info('Environment Discovery Agent completed successfully', {
        agentId: this.id,
        projectId: input.projectId,
        url: observation.finalUrl,
        executionTime,
      });

      // Diagnostic: confirm applicationMetadata included in return payload
      console.info(JSON.stringify({ event: 'agent.result.preReturn', agent: this.id, executionId: context.executionId, hasApplicationMetadata: !!applicationMetadata, applicationMetadataSummary: applicationMetadata?.summary || null, timestamp: new Date().toISOString() }));

      return {
        status: 'success',
        observation: environmentObservation,
        applicationMetadata: applicationMetadata,
        metadata: {
          executionTime,
          toolsUsed: ['BrowserTool'],
        },
      };
    } catch (error) {
      const executionTime = Date.now() - executionStartTime;

      context.logger.error('Environment Discovery Agent failed', error as Error, {
        agentId: this.id,
        projectId: input.projectId,
        executionTime,
      });

      if (error instanceof AgentError) {
        return {
          status: 'failure',
          error: {
            code: (error as any).code || ErrorCode.AgentExecutionFailed,
            message: error.message,
          },
          metadata: {
            executionTime,
            toolsUsed: ['BrowserTool'],
          },
        };
      }

      return {
        status: 'failure',
        error: {
          code: ErrorCode.AgentExecutionFailed,
          message: (error as Error).message,
        },
        metadata: {
          executionTime,
          toolsUsed: ['BrowserTool'],
        },
      };
    } finally {
      try {
        // Agent-level cleanup: ensure tool cleanup is called but avoid interfering with tool-local context lifecycle
        await this.browserTool.cleanup();
      } catch (cleanupError) {
        context.logger.warn('Failed to cleanup browser tool', { error: (cleanupError as Error).message });
      }
      console.info(JSON.stringify({ event: 'agent.cleanup.called', agent: this.id, executionId: context.executionId, timestamp: new Date().toISOString() }));
    }
  }
}
