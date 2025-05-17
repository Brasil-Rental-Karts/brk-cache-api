import redisClient from '../config/redis';
import { Club, CLUB_KEY_PREFIX, parseClubKey } from '../models/club.model';
import { RedisUtils } from '../utils/redis.utils';

export class ClubController {
  /**
   * Get all clubs from Redis
   */
  public static async getAllClubs(): Promise<Club[]> {
    try {
      // Use the more efficient scan method instead of keys
      const keys = await RedisUtils.scanKeys(`${CLUB_KEY_PREFIX}*`);
      
      if (keys.length === 0) {
        return [];
      }
      
      // Use the utility method to get multiple values efficiently
      const results = await RedisUtils.getMultiple(keys);
      
      // Cast the results to Club type
      return results as Club[];
    } catch (error) {
      console.error('Error fetching all clubs:', error);
      throw error;
    }
  }

  /**
   * Get a club by ID
   */
  public static async getClubById(id: string): Promise<Club | null> {
    try {
      const key = `${CLUB_KEY_PREFIX}${id}`;
      const data = await redisClient.get(key);
      
      if (!data) return null;
      
      return JSON.parse(data) as Club;
    } catch (error) {
      console.error(`Error fetching club with ID ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get clubs by name (case-insensitive partial match)
   */
  public static async getClubsByName(name: string): Promise<Club[]> {
    try {
      const clubs = await this.getAllClubs();
      
      // Filter clubs by name (case-insensitive)
      const searchName = name.toLowerCase();
      return clubs.filter(club => 
        club.name.toLowerCase().includes(searchName)
      );
    } catch (error) {
      console.error(`Error fetching clubs by name ${name}:`, error);
      throw error;
    }
  }

  /**
   * Generic method to get entities by pattern
   * This can be used for future entity types
   */
  public static async getEntitiesByPattern(pattern: string): Promise<Record<string, any>[]> {
    try {
      // Use the more efficient scan method
      const keys = await RedisUtils.scanKeys(pattern);
      
      if (keys.length === 0) {
        return [];
      }
      
      // Use the utility method for better performance
      return await RedisUtils.getMultiple(keys);
    } catch (error) {
      console.error('Error fetching entities by pattern:', error);
      throw error;
    }
  }
}