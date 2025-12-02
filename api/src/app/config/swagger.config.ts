/**
 * @fileoverview Swagger/OpenAPI configuration.
 *
 * @module config/swagger
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Visa API',
      version: '1.0.0',
      description:
        'A REST API for managing visas with currency conversion support',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Visas',
        description: 'Visa management endpoints',
      },
    ],
  },
  apis: [
    `${process.cwd()}/api/src/app/routes/*.ts`,
    `${process.cwd()}/api/src/app/app.ts`,
    `${process.cwd()}/dist/api/src/app/routes/*.js`,
    `${process.cwd()}/dist/api/src/app/app.js`,
  ], // Path to the API files (supports both source and compiled)
};

export const swaggerSpec = swaggerJsdoc(options);
