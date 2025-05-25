import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BRK Cache API',
      version,
      description: 'Fast Redis cache API for multiple entity types (club, event, pilot, ranking, regulation, etc.)',
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: '/api',
        description: 'API Server',
      },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
            },
            message: {
              type: 'string',
            },
          },
        },
        HealthCheck: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ok', 'error'],
              description: 'Overall system status',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Current server time',
            },
            uptime: {
              type: 'number',
              description: 'Server uptime in seconds',
            },
            redis: {
              type: 'string',
              enum: ['connected', 'disconnected'],
              description: 'Redis connection status',
            },
            version: {
              type: 'string',
              description: 'API version',
            },
            environment: {
              type: 'string',
              description: 'Current environment (development, production)',
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
};

export const specs = swaggerJsdoc(options);