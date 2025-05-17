import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BRK Cache API',
      version,
      description: 'Fast Redis cache API for club entities',
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
        Club: {
          type: 'object',
          required: ['id', 'name'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the club',
            },
            name: {
              type: 'string',
              description: 'Name of the club',
            },
            // Add other club properties as needed
          },
        },
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