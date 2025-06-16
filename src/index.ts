import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler, performanceMonitor, notFoundHandler } from './middleware/error.middleware';
import { RedisUtils } from './utils/redis.utils';
import { specs } from './config/swagger';
import { version } from '../package.json';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Request logging
app.use(express.json()); // Parse JSON bodies
app.use(performanceMonitor); // Performance monitoring

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Routes
app.use('/api', routes);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Check API health status
 *     description: Returns health information about the API and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Health information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */
app.get('/api/health', async (req, res) => {
  const redisHealth = await RedisUtils.healthCheck();
  const uptime = process.uptime();
  
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime),
    redis: redisHealth ? 'connected' : 'disconnected',
    version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

export default app;