import { Router, Request, Response, NextFunction } from 'express';
import type { ILogger } from '@testpilot/contracts';
import { ResultStatus } from '@testpilot/contracts';
import { Orchestrator } from '@testpilot/orchestrator';
import { EnvironmentDiscoveryWorkflow } from '@testpilot/workflows';
import type { EnvironmentDiscoveryApiResponse } from './types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create environment discovery routes
 */
export function createEnvironmentDiscoveryRoutes(logger: ILogger): Router {
  const router = Router();
  const orchestrator = new Orchestrator(logger);
  const workflow = new EnvironmentDiscoveryWorkflow();

  /**
   * POST /api/v1/projects/:projectId/environment-discovery
   * Trigger environment discovery for a URL
   */
  router.post(
    '/api/v1/projects/:projectId/environment-discovery',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { projectId } = req.params;
        const { url, timeout } = req.body;

        // Validate required fields
        if (!url || typeof url !== 'string') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'URL is required and must be a string',
            },
            meta: {
              timestamp: new Date().toISOString(),
            },
          });
        }

        if (!projectId || typeof projectId !== 'string') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_INPUT',
              message: 'Project ID is required',
            },
            meta: {
              timestamp: new Date().toISOString(),
            },
          });
        }

        const executionId = uuidv4();
        const startTime = Date.now();

        logger.info('Environment discovery requested', {
          executionId,
          projectId,
          url,
        });

        // Execute workflow through orchestrator
        const executionResult = await orchestrator.execute(workflow, {
          projectId,
          workflowId: workflow.id,
          input: {
            projectId,
            url,
            timeout,
          },
        });

        const duration = Date.now() - startTime;

        // Transform result to API response
        let apiResponse: any = {
          projectId,
          executionId,
          status: executionResult.result.status,
          metadata: {
            executionTime: duration,
            toolsUsed: executionResult.result.metadata?.toolsUsed || [],
          },
        };

        if (executionResult.result.status === 'success' && executionResult.result.data) {
          const discovery = (executionResult.result.data as any).discovery;
          if (discovery && discovery.observation) {
            apiResponse.observation = {
              requestedUrl: discovery.observation.requestedUrl,
              finalUrl: discovery.observation.finalUrl,
              title: discovery.observation.title,
              viewport: discovery.observation.viewport,
              screenshot: discovery.observation.screenshot,
              navigationStatus: discovery.observation.navigationStatus,
              loadDuration: discovery.observation.loadDuration,
                timestamp: new Date(discovery.observation.timestamp).toISOString(),
            };
              if (discovery.applicationMetadata) {
                apiResponse.applicationMetadata = discovery.applicationMetadata;
              }
          }
        } else if (executionResult.result.status === ResultStatus.Failed) {
          apiResponse.error = executionResult.result.error;
        }

        logger.info('Environment discovery completed', {
          executionId,
          projectId,
          status: apiResponse.status,
          duration,
        });

        res.status(200).json({
          success: executionResult.result.status === 'success',
          data: apiResponse as EnvironmentDiscoveryApiResponse,
          meta: {
            timestamp: new Date().toISOString(),
            executionId,
            duration,
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
