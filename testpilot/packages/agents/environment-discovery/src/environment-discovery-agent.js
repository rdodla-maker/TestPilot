import { BaseAgent } from '@testpilot/core';
import { AgentError, ErrorCode } from '@testpilot/contracts';
import { BrowserTool } from '@testpilot/tools-browser';
/**
 * Environment Discovery Agent
 * Mission: Observe a target web application and collect reliable raw evidence
 */
export class EnvironmentDiscoveryAgent extends BaseAgent {
    browserTool;
    constructor() {
        const id = 'environment-discovery-agent';
        const name = 'Environment Discovery Agent';
        const description = 'Observes target web applications and collects reliable raw evidence including HTML, screenshots, navigation details, and page metadata.';
        super(id, name, description);
        this.browserTool = new BrowserTool();
    }
    async onExecute(input, context) {
        context.logger.info('Environment Discovery Agent starting', {
            agentId: this.id,
            projectId: input.projectId,
            url: input.url,
        });
        const executionStartTime = Date.now();
        try {
            // Validate input
            if (!input.projectId || typeof input.projectId !== 'string') {
                throw new AgentError(ErrorCode.InvalidInput, 'Project ID is required and must be a string', { input });
            }
            if (!input.url || typeof input.url !== 'string') {
                throw new AgentError(ErrorCode.InvalidInput, 'URL is required and must be a string', { input });
            }
            context.logger.debug('Input validation passed', { projectId: input.projectId });
            // Use browser tool to observe page
            context.logger.info('Initiating page observation', { url: input.url });
            const toolResult = await this.browserTool.execute({
                url: input.url,
                timeout: input.timeout || 30000,
                captureScreenshot: true,
                captureHtml: true,
            }, context);
            if (!toolResult.success) {
                throw new AgentError(ErrorCode.ToolExecutionFailed, `Browser tool failed: ${toolResult.error?.message}`, toolResult.error);
            }
            if (!toolResult.output) {
                throw new AgentError(ErrorCode.ToolExecutionFailed, 'Browser tool returned no output');
            }
            const browserOutput = toolResult.output;
            const observation = browserOutput.observation;
            // Transform to agent output
            const environmentObservation = {
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
            const executionTime = Date.now() - executionStartTime;
            context.logger.info('Environment Discovery Agent completed successfully', {
                agentId: this.id,
                projectId: input.projectId,
                url: observation.finalUrl,
                executionTime,
            });
            return {
                status: 'success',
                observation: environmentObservation,
                metadata: {
                    executionTime,
                    toolsUsed: ['BrowserTool'],
                },
            };
        }
        catch (error) {
            const executionTime = Date.now() - executionStartTime;
            context.logger.error('Environment Discovery Agent failed', error, {
                agentId: this.id,
                projectId: input.projectId,
                executionTime,
            });
            if (error instanceof AgentError) {
                return {
                    status: 'failure',
                    error: {
                        code: error.code || ErrorCode.AgentExecutionFailed,
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
                    message: error.message,
                },
                metadata: {
                    executionTime,
                    toolsUsed: ['BrowserTool'],
                },
            };
        }
        finally {
            try {
                await this.browserTool.cleanup();
            }
            catch (cleanupError) {
                context.logger.warn('Failed to cleanup browser tool', { error: cleanupError.message });
            }
        }
    }
}
//# sourceMappingURL=environment-discovery-agent.js.map