import { Router, Request, Response, NextFunction } from 'express';
import type { ILogger } from '@testpilot/contracts';
import { ResultStatus } from '@testpilot/contracts';
import { Orchestrator } from '@testpilot/orchestrator';
import { EnvironmentDiscoveryWorkflow } from '@testpilot/workflows';
import type { EnvironmentDiscoveryApiResponse } from './types.js';
import { v4 as uuidv4 } from 'uuid';
import { createDefaultApplicationProfileService } from '@testpilot/database';
import type { ApplicationProfileService } from '@testpilot/database';

const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function isValidIdentifier(value: string): boolean {
  return IDENTIFIER_PATTERN.test(value);
}

/**
 * Create environment discovery routes
 */
export function createEnvironmentDiscoveryRoutes(logger: ILogger, profileServiceOverride?: ApplicationProfileService): Router {
  const router = Router();
  const orchestrator = new Orchestrator(logger);
  const profileService = profileServiceOverride || createDefaultApplicationProfileService();
  const workflow = new EnvironmentDiscoveryWorkflow(profileService);

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
        if (!url || typeof url !== 'string' || url.length > 2048) {
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

        if (!projectId || typeof projectId !== 'string' || !isValidIdentifier(projectId)) {
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

        if (timeout !== undefined && (typeof timeout !== 'number' || !Number.isInteger(timeout) || timeout < 1000 || timeout > 120000)) {
          return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Timeout must be an integer between 1000 and 120000 milliseconds' } });
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
        const apiResponse: any = {
          projectId,
          executionId,
          status: executionResult.result.status,
          metadata: {
            executionTime: duration,
            toolsUsed: executionResult.result.metadata?.toolsUsed || [],
          },
        };

        if (executionResult.result.status === 'success' && executionResult.result.data) {
          const workflowData = executionResult.result.data as any;
          const discovery = workflowData.discovery;
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
          if (workflowData.intelligence) {
            apiResponse.applicationIntelligence = workflowData.intelligence;
          }
          if (workflowData.persistence) {
            apiResponse.persistence = workflowData.persistence;
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

  router.get('/api/v1/projects/:projectId/profile', async (req, res, next) => {
    try {
      if (!isValidIdentifier(req.params.projectId)) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid project ID' } });
      const profile = await profileService.getProfile(req.params.projectId);
      if (!profile) return res.status(404).json({ success: false, error: { code: 'PROFILE_NOT_FOUND', message: 'Application profile was not found' } });
      return res.json({ success: true, data: profile });
    } catch (error) { return next(error); }
  });

  router.get('/api/v1/projects/:projectId/intelligence', async (req, res, next) => {
    try {
      if (!isValidIdentifier(req.params.projectId)) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid project ID' } });
      const snapshot = await profileService.getLatestSnapshot(req.params.projectId);
      if (!snapshot) return res.status(404).json({ success: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Current intelligence snapshot was not found' } });
      return res.json({ success: true, data: snapshot });
    } catch (error) { return next(error); }
  });

  router.get('/api/v1/projects/:projectId/intelligence/snapshots', async (req, res, next) => {
    try {
      if (!isValidIdentifier(req.params.projectId)) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid project ID' } });
      return res.json({ success: true, data: await profileService.listSnapshots(req.params.projectId) });
    } catch (error) { return next(error); }
  });

  router.get('/api/v1/projects/:projectId/intelligence/snapshots/:snapshotId', async (req, res, next) => {
    try {
      if (!isValidIdentifier(req.params.projectId) || !isValidIdentifier(req.params.snapshotId)) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid snapshot or project ID' } });
      const snapshot = await profileService.getSnapshot(req.params.snapshotId);
      if (!snapshot || snapshot.applicationId !== req.params.projectId) return res.status(404).json({ success: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Intelligence snapshot was not found' } });
      return res.json({ success: true, data: snapshot });
    } catch (error) { return next(error); }
  });

  router.get('/api/v1/projects/:projectId/intelligence/compare', async (req, res, next) => {
    try {
      if (!isValidIdentifier(req.params.projectId)) return res.status(400).json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid project ID' } });
      const fromId = typeof req.query.from === 'string' ? req.query.from : '';
      const toId = typeof req.query.to === 'string' ? req.query.to : '';
      if (!isValidIdentifier(fromId) || !isValidIdentifier(toId)) return res.status(400).json({ success: false, error: { code: 'INVALID_COMPARISON', message: 'Both from and to snapshot IDs are required and valid' } });
      const [from, to] = await Promise.all([profileService.getSnapshot(fromId), profileService.getSnapshot(toId)]);
      if (!from || !to || from.applicationId !== req.params.projectId || to.applicationId !== req.params.projectId) {
        return res.status(404).json({ success: false, error: { code: 'SNAPSHOT_NOT_FOUND', message: 'Comparison snapshot was not found' } });
      }
      return res.json({ success: true, data: profileService.compareSnapshots(from, to) });
    } catch (error) { return next(error); }
  });

  return router;
}
