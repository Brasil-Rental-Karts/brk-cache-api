import redisClient from '../config/redis';

/**
 * Utility functions for Redis operations
 */
export class RedisUtils {
  /**
   * Scan Redis for keys matching a pattern with better performance than KEYS
   * This is more efficient for large datasets
   */
  public static async scanKeys(pattern: string): Promise<string[]> {
    let cursor = '0';
    const keys: string[] = [];
    
    do {
      // Use SCAN instead of KEYS for better performance on large datasets
      const [nextCursor, matchedKeys] = await redisClient.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        '100'
      );
      
      cursor = nextCursor;
      keys.push(...matchedKeys);
    } while (cursor !== '0');
    
    return keys;
  }
  
  /**
   * Get multiple values from Redis in a single pipeline operation
   */
  public static async getMultiple(keys: string[]): Promise<Record<string, any>[]> {
    if (keys.length === 0) return [];
    
    const pipeline = redisClient.pipeline();
    keys.forEach(key => pipeline.get(key));
    
    const results = await pipeline.exec();
    if (!results) return [];
    
    return results
      .map((result, index) => {
        const [err, data] = result as [Error | null, string | null];
        if (err || !data) return null;
        
        try {
          const parsed = JSON.parse(data);
          // Add key information to help identify the entity
          parsed._redisKey = keys[index];
          return parsed;
        } catch (e) {
          console.error(`Error parsing Redis data for key ${keys[index]}:`, e);
          return null;
        }
      })
      .filter(item => item !== null);
  }
  
  /**
   * Check if Redis is connected and healthy
   */
  public static async healthCheck(): Promise<boolean> {
    try {
      const pong = await redisClient.ping();
      return pong === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  }
}