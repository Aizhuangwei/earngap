// Error Handling Middleware
import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { sendError, ErrorCodes } from './response';
import { logger } from '../logger';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        sendError(res, ErrorCodes.CONFLICT, 'Resource already exists', 409);
        return;
      case 'P2025':
        sendError(res, ErrorCodes.NOT_FOUND, 'Resource not found', 404);
        return;
      default:
        logger.error({ msg: 'Database error', code: err.code, meta: err.meta });
        sendError(res, ErrorCodes.INTERNAL_ERROR, 'Database error', 500);
        return;
    }
  }

  // Zod validation errors
  if (err instanceof ZodError) {
    sendError(res, ErrorCodes.VALIDATION_ERROR, 'Validation failed', 400, err.errors);
    return;
  }

  // JSON parse error
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(res, ErrorCodes.VALIDATION_ERROR, 'Invalid JSON', 400);
    return;
  }

  // Unknown errors
  logger.error({
    msg: 'Unhandled error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    method: req.method,
    url: req.url,
  });

  sendError(
    res,
    ErrorCodes.INTERNAL_ERROR,
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    500
  );
}
