/**
 * @fileoverview Express error handling middleware.
 *
 * @module middleware/error-handler
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';

/**
 * Error handling middleware. Converts AppError to HTTP responses, logs unexpected errors.
 *
 * @param err - Error object.
 * @param _req - Express request.
 * @param res - Express response.
 * @param _next - Express next function.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.error('Unexpected error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
}
