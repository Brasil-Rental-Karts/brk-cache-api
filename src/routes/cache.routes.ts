import { Router } from 'express';
import { RedisUtils } from '../utils/redis.utils';
import redisClient from '../config/redis';

const router = Router();

/**
 * @swagger
 * /cache/championships:
 *   get:
 *     summary: Get all championships from cache
 *     description: Returns all championships using optimized Redis Hash operations
 *     tags: [Championships]
 *     responses:
 *       200:
 *         description: List of championships
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/championships', async (req, res) => {
  try {
    const championshipIds = await RedisUtils.getSetMembers('championships:all');
    if (!championshipIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const championshipKeys = championshipIds.map(id => `championship:${id}`);
    const championships = await RedisUtils.getMultipleHashes(championshipKeys);
    
    res.json({ 
      count: championships.length, 
      data: championships,
      performance: {
        networkCalls: 2, // 1 for set members + 1 for pipeline hashes
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch championships', details: message });
  }
});

/**
 * @swagger
 * /cache/championships/{id}:
 *   get:
 *     summary: Get a specific championship by ID
 *     description: Returns championship data using optimized Redis Hash operations
 *     tags: [Championships]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Championship ID
 *     responses:
 *       200:
 *         description: Championship data
 *       404:
 *         description: Championship not found
 */
router.get('/championships/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const championship = await RedisUtils.getHash(`championship:${id}`);
    if (!championship) {
      return res.status(404).json({ error: 'Championship not found' });
    }
    
    res.json({
      data: championship,
      performance: {
        networkCalls: 1,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch championship', details: message });
  }
});

/**
 * @swagger
 * /cache/championships/{id}/seasons:
 *   get:
 *     summary: Get championship with all its seasons
 *     description: Returns championship and all related seasons using ultra-fast Redis operations (2 network calls total)
 *     tags: [Championships]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Championship ID
 *     responses:
 *       200:
 *         description: Championship with seasons
 *       404:
 *         description: Championship not found
 */
router.get('/championships/:id/seasons', async (req, res) => {
  const { id } = req.params;
  try {
    const championshipWithSeasons = await RedisUtils.getChampionshipWithSeasons(id);
    if (!championshipWithSeasons) {
      return res.status(404).json({ error: 'Championship not found' });
    }
    
    res.json({
      data: championshipWithSeasons,
      performance: {
        networkCalls: 2, // Ultra-optimized: championship+seasonIds + all seasons data
        optimized: true,
        seasonsCount: championshipWithSeasons.seasons.length
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch championship with seasons', details: message });
  }
});

/**
 * @swagger
 * /cache/seasons:
 *   get:
 *     summary: Get all seasons from cache
 *     description: Returns all seasons using optimized Redis Hash operations
 *     tags: [Seasons]
 *     responses:
 *       200:
 *         description: List of seasons
 */
router.get('/seasons', async (req, res) => {
  try {
    const seasonIds = await RedisUtils.getSetMembers('seasons:all');
    if (!seasonIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const seasonKeys = seasonIds.map(id => `season:${id}`);
    const seasons = await RedisUtils.getMultipleHashes(seasonKeys);
    
    res.json({ 
      count: seasons.length, 
      data: seasons,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch seasons', details: message });
  }
});

/**
 * @swagger
 * /cache/seasons/{id}:
 *   get:
 *     summary: Get a specific season by ID
 *     description: Returns season data using optimized Redis Hash operations
 *     tags: [Seasons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Season ID
 *     responses:
 *       200:
 *         description: Season data
 *       404:
 *         description: Season not found
 */
router.get('/seasons/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const season = await RedisUtils.getHash(`season:${id}`);
    if (!season) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    res.json({
      data: season,
      performance: {
        networkCalls: 1,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch season', details: message });
  }
});

/**
 * @swagger
 * /cache/seasons/{id}/complete:
 *   get:
 *     summary: Get season with all categories and stages
 *     description: Returns season with all related categories and stages using ultra-fast Redis operations (3 network calls total)
 *     tags: [Seasons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Season ID
 *     responses:
 *       200:
 *         description: Complete season data with categories and stages
 *       404:
 *         description: Season not found
 */
router.get('/seasons/:id/complete', async (req, res) => {
  const { id } = req.params;
  try {
    const completeSeasonData = await RedisUtils.getSeasonWithCategoriesStagesAndRegulations(id);
    if (!completeSeasonData) {
      return res.status(404).json({ error: 'Season not found' });
    }
    
    res.json({
      data: completeSeasonData,
      performance: {
        networkCalls: 3, // Ultra-optimized: season+IDs + categories + stages
        optimized: true,
        categoriesCount: completeSeasonData.categories.length,
        stagesCount: completeSeasonData.stages.length
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch complete season data', details: message });
  }
});

/**
 * @swagger
 * /cache/categories:
 *   get:
 *     summary: Get all categories from cache
 *     description: Returns all categories using optimized Redis Hash operations
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categoryIds = await RedisUtils.getSetMembers('categories:all');
    if (!categoryIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const categoryKeys = categoryIds.map(id => `category:${id}`);
    const categories = await RedisUtils.getMultipleHashes(categoryKeys);
    
    res.json({ 
      count: categories.length, 
      data: categories,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch categories', details: message });
  }
});

/**
 * @swagger
 * /cache/stages:
 *   get:
 *     summary: Get all stages from cache
 *     description: Returns all stages using optimized Redis Hash operations
 *     tags: [Stages]
 *     responses:
 *       200:
 *         description: List of stages
 */
router.get('/stages', async (req, res) => {
  try {
    const stageIds = await RedisUtils.getSetMembers('stages:all');
    if (!stageIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const stageKeys = stageIds.map(id => `stage:${id}`);
    const stages = await RedisUtils.getMultipleHashes(stageKeys);
    
    res.json({ 
      count: stages.length, 
      data: stages,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch stages', details: message });
  }
});

/**
 * @swagger
 * /cache/stages/{id}:
 *   get:
 *     summary: Get a specific stage by ID with results
 *     description: Returns stage data with race results using optimized Redis Hash operations
 *     tags: [Stages]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Stage ID
 *     responses:
 *       200:
 *         description: Stage data with results
 *       404:
 *         description: Stage not found
 */
router.get('/stages/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const stage = await RedisUtils.getStageWithResults(id);
    if (!stage) {
      return res.status(404).json({ error: 'Stage not found' });
    }
    
    res.json({
      data: stage,
      performance: {
        networkCalls: 1,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch stage', details: message });
  }
});

/**
 * @swagger
 * /cache/regulations:
 *   get:
 *     summary: Get all regulations from cache
 *     description: Returns all regulations using optimized Redis Hash operations
 *     tags: [Regulations]
 *     responses:
 *       200:
 *         description: List of regulations
 */
router.get('/regulations', async (req, res) => {
  try {
    const regulationIds = await RedisUtils.getSetMembers('regulations:all');
    if (!regulationIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const regulationKeys = regulationIds.map(id => `regulation:${id}`);
    const regulations = await RedisUtils.getMultipleHashes(regulationKeys);
    
    res.json({ 
      count: regulations.length, 
      data: regulations,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch regulations', details: message });
  }
});

/**
 * @swagger
 * /cache/seasons/{id}/regulations:
 *   get:
 *     summary: Get all regulations for a specific season
 *     description: Returns all regulations for a season using optimized Redis Hash operations
 *     tags: [Regulations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Season ID
 *     responses:
 *       200:
 *         description: List of regulations for the season
 *       404:
 *         description: Season not found
 */
router.get('/seasons/:id/regulations', async (req, res) => {
  const { id } = req.params;
  try {
    const regulationIds = await RedisUtils.getSetMembers(`season:${id}:regulations`);
    if (!regulationIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const regulationKeys = regulationIds.map(regId => `regulation:${regId}`);
    const regulations = await RedisUtils.getMultipleHashes(regulationKeys);
    
    // Sort by order
    const sortedRegulations = regulations.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    res.json({ 
      count: sortedRegulations.length, 
      data: sortedRegulations,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch season regulations', details: message });
  }
});

/**
 * @swagger
 * /cache/seasons/{id}/classification:
 *   get:
 *     summary: Get season classification data
 *     description: Returns classification data for a specific season using optimized Redis Hash operations
 *     tags: [Classifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Season ID
 *     responses:
 *       200:
 *         description: Season classification data
 *       404:
 *         description: Season not found
 */
router.get('/seasons/:id/classification', async (req, res) => {
  const { id } = req.params;
  try {
    const classification = await RedisUtils.getSeasonClassification(id);
    if (!classification) {
      return res.status(404).json({ error: 'Season classification not found' });
    }
    
    res.json({
      data: classification,
      performance: {
        networkCalls: 1,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch season classification', details: message });
  }
});

/**
 * @swagger
 * /cache/championships/{id}/classification:
 *   get:
 *     summary: Get championship classification data for all seasons
 *     description: Returns classification data for all seasons of a championship using optimized Redis Hash operations
 *     tags: [Classifications]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Championship ID
 *     responses:
 *       200:
 *         description: Championship classification data
 *       404:
 *         description: Championship not found
 */
router.get('/championships/:id/classification', async (req, res) => {
  const { id } = req.params;
  try {
    const championshipClassification = await RedisUtils.getChampionshipClassification(id);
    if (!championshipClassification.championship) {
      return res.status(404).json({ error: 'Championship not found' });
    }
    
    res.json({
      data: championshipClassification,
      performance: {
        networkCalls: 2,
        optimized: true,
        seasonsCount: championshipClassification.classifications.length
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch championship classification', details: message });
  }
});

/**
 * @swagger
 * /cache/raceTracks:
 *   get:
 *     summary: Get all race tracks from cache
 *     description: Returns all race tracks using optimized Redis Hash operations
 *     tags: [RaceTracks]
 *     responses:
 *       200:
 *         description: List of race tracks
 */
router.get('/raceTracks', async (req, res) => {
  try {
    const raceTrackIds = await RedisUtils.getSetMembers('raceTracks:all');
    if (!raceTrackIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const raceTrackKeys = raceTrackIds.map(id => `raceTrack:${id}`);
    const raceTracks = await RedisUtils.getMultipleHashes(raceTrackKeys);
    
    res.json({ 
      count: raceTracks.length, 
      data: raceTracks,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch race tracks', details: message });
  }
});

/**
 * @swagger
 * /cache/raceTracks/{id}:
 *   get:
 *     summary: Get a specific race track by ID
 *     description: Returns race track data using optimized Redis Hash operations
 *     tags: [RaceTracks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Race Track ID
 *     responses:
 *       200:
 *         description: Race track data
 *       404:
 *         description: Race track not found
 */
router.get('/raceTracks/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const raceTrack = await RedisUtils.getHash(`raceTrack:${id}`);
    if (!raceTrack) {
      return res.status(404).json({ error: 'Race track not found' });
    }
    
    res.json({
      data: raceTrack,
      performance: {
        networkCalls: 1,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch race track', details: message });
  }
});

/**
 * @swagger
 * /cache/raceTracks/active:
 *   get:
 *     summary: Get all active race tracks from cache
 *     description: Returns all active race tracks using optimized Redis Hash operations
 *     tags: [RaceTracks]
 *     responses:
 *       200:
 *         description: List of active race tracks
 */
router.get('/raceTracks/active', async (req, res) => {
  try {
    const raceTrackIds = await RedisUtils.getSetMembers('raceTracks:all');
    if (!raceTrackIds.length) {
      return res.json({ count: 0, data: [] });
    }
    
    const raceTrackKeys = raceTrackIds.map(id => `raceTrack:${id}`);
    const raceTracks = await RedisUtils.getMultipleHashes(raceTrackKeys);
    
    // Filter only active race tracks
    const activeRaceTracks = raceTracks.filter(raceTrack => raceTrack.isActive === true);
    
    res.json({ 
      count: activeRaceTracks.length, 
      data: activeRaceTracks,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch active race tracks', details: message });
  }
});

/**
 * @swagger
 * /cache/users/{id}:
 *   get:
 *     summary: Get a specific user by ID
 *     description: Returns user data using optimized Redis Hash operations
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User data
 *       404:
 *         description: User not found
 */
router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await RedisUtils.getHash(`user:${id}`);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      data: user,
      performance: {
        networkCalls: 1,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch user', details: message });
  }
});

/**
 * @swagger
 * /cache/users/batch:
 *   post:
 *     summary: Get multiple users by IDs
 *     description: Returns multiple users data using optimized Redis Hash operations
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of user IDs
 *     responses:
 *       200:
 *         description: List of users data
 */
router.post('/users/batch', async (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ error: 'userIds must be an array' });
  }
  
  try {
    const userKeys = userIds.map(id => `user:${id}`);
    const users = await RedisUtils.getMultipleHashes(userKeys);
    
    res.json({ 
      count: users.length, 
      data: users,
      performance: {
        networkCalls: 2,
        optimized: true
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch users', details: message });
  }
});

/**
 * @swagger
 * /cache/{prefix}:
 *   get:
 *     summary: Fetch all data for a given key prefix from Redis (Legacy)
 *     description: Legacy endpoint - Returns all Redis values for keys matching the prefix. Use specific endpoints for better performance.
 *     deprecated: true
 *     parameters:
 *       - in: path
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: The key prefix to search for
 *     responses:
 *       200:
 *         description: List of data objects for the given prefix
 *       400:
 *         description: Prefix is required
 *       404:
 *         description: No data found for this prefix
 *       500:
 *         description: Failed to fetch data
 */
router.get('/:prefix', async (req, res) => {
  const { prefix } = req.params;
  if (!prefix) {
    return res.status(400).json({ error: 'Prefix is required' });
  }
  
  try {
    // Check if it's one of the optimized prefixes
    if (['championship', 'season', 'category', 'stage'].includes(prefix)) {
      return res.status(400).json({ 
        error: 'Use specific optimized endpoints for better performance',
        suggestion: `Use /cache/${prefix}s instead`,
        optimizedEndpoints: [
          `/cache/${prefix}s`,
          `/cache/${prefix}s/{id}`
        ]
      });
    }
    
    const pattern = `${prefix}:*`;
    const keys = await RedisUtils.scanKeys(pattern);
    if (!keys.length) {
      return res.status(404).json({ error: 'No data found for this prefix' });
    }
    
    // Try Hash operations first, fallback to legacy
    const hashData = await RedisUtils.getMultipleHashes(keys);
    if (hashData.length > 0) {
      res.json({ 
        count: hashData.length, 
        data: hashData,
        performance: {
          networkCalls: 2,
          optimized: true,
          note: 'Using optimized Hash operations'
        }
      });
    } else {
      // Fallback to legacy JSON string operations
      const legacyData = await RedisUtils.getMultiple(keys);
      res.json({ 
        count: legacyData.length, 
        data: legacyData,
        performance: {
          networkCalls: keys.length + 1,
          optimized: false,
          note: 'Using legacy JSON string operations'
        }
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch data', details: message });
  }
});

/**
 * @swagger
 * /cache/{prefix}/{id}:
 *   get:
 *     summary: Fetch a specific item by prefix and id from Redis (Legacy)
 *     description: Legacy endpoint - Returns a single item for the given prefix and id. Use specific endpoints for better performance.
 *     deprecated: true
 *     parameters:
 *       - in: path
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: The key prefix
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the item
 *     responses:
 *       200:
 *         description: The requested item
 *       404:
 *         description: Item not found
 *       500:
 *         description: Failed to fetch data
 */
router.get('/:prefix/:id', async (req, res) => {
  const { prefix, id } = req.params;
  if (!prefix || !id) {
    return res.status(400).json({ error: 'Prefix and id are required' });
  }
  
  try {
    // Check if it's one of the optimized prefixes
    if (['championship', 'season', 'category', 'stage'].includes(prefix)) {
      return res.status(400).json({ 
        error: 'Use specific optimized endpoints for better performance',
        suggestion: `Use /cache/${prefix}s/${id} instead`,
        optimizedEndpoint: `/cache/${prefix}s/${id}`
      });
    }
    
    const key = `${prefix}:${id}`;
    
    // Try Hash operation first
    const hashData = await RedisUtils.getHash(key);
    if (hashData) {
      return res.json({
        data: hashData,
        performance: {
          networkCalls: 1,
          optimized: true,
          note: 'Using optimized Hash operations'
        }
      });
    }
    
    // Fallback to legacy JSON string operation
    const value = await redisClient.get(key);
    if (!value) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({
      data: JSON.parse(value),
      performance: {
        networkCalls: 1,
        optimized: false,
        note: 'Using legacy JSON string operations'
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch data', details: message });
  }
});

export default router; 