import { Router } from 'express';
import clubRoutes from './club.routes';

const router = Router();

// Club routes
router.use('/clubs', clubRoutes);

// Add future entity routes here
// Example: router.use('/teams', teamRoutes);

export default router;