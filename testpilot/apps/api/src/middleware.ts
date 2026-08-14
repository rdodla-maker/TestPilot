import type { Request, Response, NextFunction } from 'express';
import type { ILogger } from '@testpilot/contracts';
import type { ApiResponse } from './types';
import { randomUUID } from 'node:crypto';

export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

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
    const code = typeof err?.code === 'string' && /^[A-Z0-9_]{3,64}$/.test(err.code) ? err.code : 'INTERNAL_SERVER_ERROR';
    const safeCodes = new Set(['INVALID_CONTENT_TYPE', 'INVALID_INPUT', 'INVALID_COMPARISON', 'PROFILE_NOT_FOUND', 'SNAPSHOT_NOT_FOUND', 'APPLICATION_PROFILE_NOT_FOUND', 'INVALID_SNAPSHOT', 'PERSISTENCE_FAILED', 'APPLICATION_INTELLIGENCE_INVALID']);
    const message = safeCodes.has(code) && typeof err?.message === 'string' ? err.message : 'An unexpected error occurred';
    const status = err.status || 500;
    const requestId = randomUUID();

    logger.error('API Error', undefined, { code, status, requestId });

    const response: ApiResponse = {
      success: false,
      error: {
        code,
        message,
        details: undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
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
