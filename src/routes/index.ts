import { Router } from 'express';
import cacheRoutes from './cache.routes';

const router = Router();

// Cache prefix route
router.use('/cache', cacheRoutes);

// Add future entity routes here
// Example: router.use('/teams', teamRoutes);

export default router;