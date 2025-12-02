/**
 * @fileoverview Async error handling middleware wrapper.
 * Provides a utility to wrap async route handlers and ensure errors are properly caught
 * and forwarded to Express error handling middleware.
 *
 * @module middleware/async-handler
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Wraps async route handlers to catch errors and pass them to Express error handler.
 *
 * @param fn - Async route handler function
 * @returns Express middleware that catches async errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
