/**
 * @fileoverview Express application factory and configuration.
 *
 * @module app
 */

import express, { Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import { errorHandler } from './middleware/error-handler';
import { rateLimiter } from './middleware/rate-limiter';
import { VisaRepository } from './data/visa.repository';
import { CurrencyService } from './services/currency.service';
import { createVisasRouter } from './routes/visas.routes';
import { swaggerSpec } from './config/swagger.config';

/**
 * Creates and configures an Express application instance.
 *
 * @param repository - Visa data repository.
 * @param currencyService - Optional currency service (defaults to USD-only if not provided).
 * @returns Configured Express application.
 */
export const createApp = (
  repository: VisaRepository,
  currencyService?: CurrencyService
) => {
  const app = express();
  app.use(express.json());

  // Rate limiting (applies to all routes)
  app.use(rateLimiter);

  /**
   * @swagger
   * /health:
   *   get:
   *     summary: Health check endpoint
   *     tags: [Health]
   *     responses:
   *       200:
   *         description: Service is healthy
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: ok
   */
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // API Documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Visa routes
  app.use('/api/visas', createVisasRouter(repository, currencyService));

  // Error handling middleware (must be last)
  app.use(errorHandler);

  return app;
};
