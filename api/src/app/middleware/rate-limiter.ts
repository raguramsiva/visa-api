/**
 * @fileoverview Rate limiting middleware for Express.
 *
 * @module middleware/rate-limiter
 */

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

/**
 * Default rate limit configuration.
 * Limits requests per IP address to prevent abuse.
 */
const windowMs = process.env.RATE_LIMIT_WINDOW_MS
  ? Number(process.env.RATE_LIMIT_WINDOW_MS)
  : 60 * 1000; // 1 minute

const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
  ? Number(process.env.RATE_LIMIT_MAX_REQUESTS)
  : 200; // 200 requests per window

const minutes = Math.floor(windowMs / (60 * 1000));
const timeWindow = `${minutes} minute${minutes > 1 ? 's' : ''}`;

/**
 * Global rate limiter middleware.
 */
export const rateLimiter = rateLimit({
  windowMs,
  max: maxRequests,
  message: {
    error: 'Too many requests',
    message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindow}.`,
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Maximum ${maxRequests} requests per ${timeWindow}.`,
    });
  },
});
