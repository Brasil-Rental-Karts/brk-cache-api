import { Router } from 'express';
import { RedisUtils } from '../utils/redis.utils';
import redisClient from '../config/redis';

const router = Router();

/**
 * @swagger
 * /cache/{prefix}:
 *   get:
 *     summary: Fetch all data for a given key prefix from Redis
 *     description: Returns all Redis values for keys matching the prefix (e.g., club, event, pilot, ranking, regulation).
 *     parameters:
 *       - in: path
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: The key prefix to search for (e.g., club, event, pilot, ranking, regulation)
 *     responses:
 *       200:
 *         description: List of data objects for the given prefix
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
 *       400:
 *         description: Prefix is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No data found for this prefix
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:prefix', async (req, res) => {
  const { prefix } = req.params;
  if (!prefix) {
    return res.status(400).json({ error: 'Prefix is required' });
  }
  try {
    const pattern = `${prefix}:*`;
    const keys = await RedisUtils.scanKeys(pattern);
    if (!keys.length) {
      return res.status(404).json({ error: 'No data found for this prefix' });
    }
    const data = await RedisUtils.getMultiple(keys);
    res.json({ count: data.length, data });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch data', details: message });
  }
});

/**
 * @swagger
 * /cache/{prefix}/{id}:
 *   get:
 *     summary: Fetch a specific item by prefix and id from Redis
 *     description: Returns a single item for the given prefix and id (e.g., /cache/club/uuid).
 *     parameters:
 *       - in: path
 *         name: prefix
 *         required: true
 *         schema:
 *           type: string
 *         description: The key prefix (e.g., club, event, pilot, ranking, regulation)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The id of the item
 *     responses:
 *       200:
 *         description: The requested item
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Failed to fetch data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:prefix/:id', async (req, res) => {
  const { prefix, id } = req.params;
  if (!prefix || !id) {
    return res.status(400).json({ error: 'Prefix and id are required' });
  }
  try {
    const key = `${prefix}:${id}`;
    const value = await redisClient.get(key);
    if (!value) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json(JSON.parse(value));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to fetch data', details: message });
  }
});

export default router; 