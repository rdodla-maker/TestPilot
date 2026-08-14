import type { Request, Response, NextFunction } from 'express';
import type { ILogger } from '@testpilot/contracts';
import type { ApiResponse } from './types';

/**
 * Request logging middleware
 */
export function loggingMiddleware(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info(`${req.method} ${req.path}`, {
        status: res.statusCode,
        duration,
        contentLength: res.get('content-length'),
      });
    });

    next();
  };
}

/**
 * Global error handler
 */
export function errorHandler(logger: ILogger) {
  return (err: any, _req: Request, res: Response, _next: NextFunction) => {
    const code = err.code || 'INTERNAL_SERVER_ERROR';
    const message = err.message || 'An unexpected error occurred';
    const status = err.status || 500;

    logger.error(`API Error: ${message}`, err);

    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details: process.env.NODE_ENV === 'development' ? err.details : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    res.status(status).json(response);
  };
}

/**
 * Request validation middleware
 */
export function validateJsonBody(req: Request, res: Response, next: NextFunction) {
  if (
    (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') &&
    !req.is('application/json')
  ) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_CONTENT_TYPE',
        message: 'Content-Type must be application/json',
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    });
  }

  next();
}
