import { Router, Request, Response } from 'express';
import { ClubController } from '../controllers/club.controller';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Clubs
 *   description: Club management endpoints
 */

/**
 * @swagger
 * /clubs:
 *   get:
 *     summary: Get all clubs
 *     description: Retrieve a list of all clubs from the cache
 *     tags: [Clubs]
 *     responses:
 *       200:
 *         description: A list of clubs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Club'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const clubs = await ClubController.getAllClubs();
    return res.status(200).json(clubs);
  } catch (error) {
    console.error('Error in GET /clubs:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /clubs/id/{id}:
 *   get:
 *     summary: Get club by ID
 *     description: Retrieve a single club by its unique ID
 *     tags: [Clubs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique club ID
 *     responses:
 *       200:
 *         description: Club details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Club'
 *       404:
 *         description: Club not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/id/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const club = await ClubController.getClubById(id);
    
    if (!club) {
      return res.status(404).json({ error: 'Club not found' });
    }
    
    return res.status(200).json(club);
  } catch (error) {
    console.error(`Error in GET /clubs/id/${req.params.id}:`, error);
    return res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /clubs/name/{name}:
 *   get:
 *     summary: Get clubs by name
 *     description: Retrieve clubs that match the provided name (partial match supported)
 *     tags: [Clubs]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Club name to search for
 *     responses:
 *       200:
 *         description: List of matching clubs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Club'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/name/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const clubs = await ClubController.getClubsByName(name);
    
    return res.status(200).json(clubs);
  } catch (error) {
    console.error(`Error in GET /clubs/name/${req.params.name}:`, error);
    return res.status(500).json({ error: 'Server error' });
  }
});

export default router;