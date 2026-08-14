import express from 'express';
import cors from 'cors';
import { createLogger } from '@testpilot/observability';
import { getApiConfig, loadConfig } from '@testpilot/config';
import { loggingMiddleware, errorHandler, validateJsonBody } from './middleware';
import { createEnvironmentDiscoveryRoutes } from './routes';

/**
 * Start TestPilot API server
 */
async function main() {
  // Load configuration
  const config = loadConfig();
  const apiConfig = getApiConfig();

  // Create logger
  const logger = createLogger(config.logging.level, config.logging.format);

  logger.info('Starting TestPilot API', {
    environment: config.environment,
    host: apiConfig.host,
    port: apiConfig.port,
  });

  // Create Express app
  const app = express();

  // Middleware
  app.use(cors({ origin: apiConfig.corsOrigins }));
  app.use(express.json({ limit: '10mb' }));
  app.use(loggingMiddleware(logger));
  app.use(validateJsonBody);

  // Health check
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use(createEnvironmentDiscoveryRoutes(logger));

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Error handler
  app.use(errorHandler(logger));

  // Start server
  app.listen(apiConfig.port, apiConfig.host, () => {
    logger.info(`TestPilot API listening on http://${apiConfig.host}:${apiConfig.port}`);
  });
}

main().catch((error) => {
  console.error('Failed to start API:', error);
  process.exit(1);
});
