import redisClient from '../config/redis';

/**
 * High-performance utility functions for Redis Hash operations
 * Optimized for the new Redis Hash structure from brk-backend
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
   * Get multiple Redis Hashes in a single pipeline operation (ultra-fast)
   * Optimized for the new Hash structure
   */
  public static async getMultipleHashes(keys: string[]): Promise<Record<string, any>[]> {
    if (keys.length === 0) return [];
    
    const pipeline = redisClient.pipeline();
    keys.forEach(key => pipeline.hgetall(key));
    
    const results = await pipeline.exec();
    if (!results) return [];
    
    return results
      .map((result, index) => {
        const [err, data] = result as [Error | null, Record<string, string> | null];
        if (err || !data || Object.keys(data).length === 0) return null;
        
        try {
          // Convert Redis Hash data to proper types
          const parsed = this.parseHashData(data);
          // Add key information to help identify the entity
          parsed._redisKey = keys[index];
          return parsed;
        } catch (e) {
          console.error(`Error parsing Redis Hash data for key ${keys[index]}:`, e);
          return null;
        }
      })
      .filter(item => item !== null);
  }

  /**
   * Get a single Redis Hash (optimized)
   */
  public static async getHash(key: string): Promise<Record<string, any> | null> {
    try {
      const data = await redisClient.hgetall(key);
      if (!data || Object.keys(data).length === 0) return null;
      
      return this.parseHashData(data);
    } catch (error) {
      console.error(`Error getting Redis Hash for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Get all members of a Redis Set (for relationship indexes)
   */
  public static async getSetMembers(key: string): Promise<string[]> {
    try {
      return await redisClient.smembers(key);
    } catch (error) {
      console.error(`Error getting Redis Set members for key ${key}:`, error);
      return [];
    }
  }

  /**
   * Get multiple sets in parallel using pipeline
   */
  public static async getMultipleSets(keys: string[]): Promise<Record<string, string[]>> {
    if (keys.length === 0) return {};
    
    const pipeline = redisClient.pipeline();
    keys.forEach(key => pipeline.smembers(key));
    
    const results = await pipeline.exec();
    if (!results) return {};
    
    const setsData: Record<string, string[]> = {};
    results.forEach((result, index) => {
      const [err, data] = result as [Error | null, string[] | null];
      if (!err && data) {
        setsData[keys[index]] = data;
      }
    });
    
    return setsData;
  }

  /**
   * Get championship with all its seasons (ultra-fast with 2 network calls)
   */
  public static async getChampionshipWithSeasons(championshipId: string): Promise<any> {
    const championshipKey = `championship:${championshipId}`;
    const seasonsSetKey = `championship:${championshipId}:seasons`;
    
    // First call: Get championship data and season IDs in parallel
    const pipeline1 = redisClient.pipeline();
    pipeline1.hgetall(championshipKey);
    pipeline1.smembers(seasonsSetKey);
    
    const results = await pipeline1.exec();
    if (!results || results.length < 2) return null;
    
    const [championshipResult, seasonIdsResult] = results;
    
    const [champErr, champData] = championshipResult as [Error | null, Record<string, string>];
    const [seasonsErr, seasonIds] = seasonIdsResult as [Error | null, string[]];
    
    if (champErr || !champData || Object.keys(champData).length === 0) return null;
    
    const championship = this.parseHashData(champData);
    
    if (seasonsErr || !seasonIds || seasonIds.length === 0) {
      return { ...championship, seasons: [] };
    }
    
    // Second call: Get all seasons data in parallel
    const pipeline2 = redisClient.pipeline();
    seasonIds.forEach(id => pipeline2.hgetall(`season:${id}`));
    
    const seasonsResults = await pipeline2.exec();
    if (!seasonsResults) return { ...championship, seasons: [] };
    
    const seasons = seasonsResults
      .map(result => {
        const [err, data] = result as [Error | null, Record<string, string>];
        if (err || !data || Object.keys(data).length === 0) return null;
        return this.parseHashData(data);
      })
      .filter(season => season !== null);
    
    return { ...championship, seasons };
  }

  /**
   * Get season with all its categories, stages and regulations (ultra-fast with 4 network calls)
   */
  public static async getSeasonWithCategoriesStagesAndRegulations(seasonId: string): Promise<any> {
    const seasonKey = `season:${seasonId}`;
    const categoriesSetKey = `season:${seasonId}:categories`;
    const stagesSetKey = `season:${seasonId}:stages`;
    const regulationsSetKey = `season:${seasonId}:regulations`;
    
    // First call: Get season data and all related IDs in parallel
    const pipeline1 = redisClient.pipeline();
    pipeline1.hgetall(seasonKey);
    pipeline1.smembers(categoriesSetKey);
    pipeline1.smembers(stagesSetKey);
    pipeline1.smembers(regulationsSetKey);
    
    const results = await pipeline1.exec();
    if (!results || results.length < 4) return null;
    
    const [seasonResult, categoryIdsResult, stageIdsResult, regulationIdsResult] = results;
    
    if (!seasonResult) return null;
    
    const [seasonErr, seasonData] = seasonResult as [Error | null, Record<string, string>];
    if (seasonErr || !seasonData || Object.keys(seasonData).length === 0) return null;
    
    const season = this.parseHashData(seasonData);
    
    const [catErr, categoryIds] = categoryIdsResult as [Error | null, string[]];
    const [stageErr, stageIds] = stageIdsResult as [Error | null, string[]];
    const [regErr, regulationIds] = regulationIdsResult as [Error | null, string[]];
    
    // Second call: Get categories data if available
    let categories: any[] = [];
    if (!catErr && categoryIds && categoryIds.length > 0) {
      const pipeline2 = redisClient.pipeline();
      categoryIds.forEach(id => pipeline2.hgetall(`category:${id}`));
      
      const categoriesResults = await pipeline2.exec();
      if (categoriesResults) {
        categories = categoriesResults
          .map(result => {
            const [err, data] = result as [Error | null, Record<string, string>];
            if (err || !data || Object.keys(data).length === 0) return null;
            return this.parseHashData(data);
          })
          .filter(category => category !== null);
      }
    }
    
    // Third call: Get stages data if available
    let stages: any[] = [];
    if (!stageErr && stageIds && stageIds.length > 0) {
      const pipeline3 = redisClient.pipeline();
      stageIds.forEach(id => pipeline3.hgetall(`stage:${id}`));
      
      const stagesResults = await pipeline3.exec();
      if (stagesResults) {
        stages = stagesResults
          .map(result => {
            const [err, data] = result as [Error | null, Record<string, string>];
            if (err || !data || Object.keys(data).length === 0) return null;
            return this.parseHashData(data);
          })
          .filter(stage => stage !== null);
      }
    }
    
    // Fourth call: Get regulations data if available
    let regulations: any[] = [];
    if (!regErr && regulationIds && regulationIds.length > 0) {
      const pipeline4 = redisClient.pipeline();
      regulationIds.forEach(id => pipeline4.hgetall(`regulation:${id}`));
      
      const regulationsResults = await pipeline4.exec();
      if (regulationsResults) {
        regulations = regulationsResults
          .map(result => {
            const [err, data] = result as [Error | null, Record<string, string>];
            if (err || !data || Object.keys(data).length === 0) return null;
            return this.parseHashData(data);
          })
          .filter(regulation => regulation !== null)
          .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
      }
    }
    
    return { ...season, categories, stages, regulations };
  }

  /**
   * Get all regulations for a season (optimized)
   */
  public static async getSeasonRegulations(seasonId: string): Promise<any[]> {
    try {
      const regulationIds = await redisClient.smembers(`season:${seasonId}:regulations`);
      if (!regulationIds || regulationIds.length === 0) return [];
      
      const pipeline = redisClient.pipeline();
      regulationIds.forEach(id => pipeline.hgetall(`regulation:${id}`));
      
      const results = await pipeline.exec();
      if (!results) return [];
      
      const regulations = results
        .map(result => {
          const [err, data] = result as [Error | null, Record<string, string>];
          if (err || !data || Object.keys(data).length === 0) return null;
          return this.parseHashData(data);
        })
        .filter(regulation => regulation !== null)
        .sort((a, b) => (a.order || 0) - (b.order || 0)); // Sort by order
      
      return regulations;
    } catch (error) {
      console.error(`Error getting regulations for season ${seasonId}:`, error);
      return [];
    }
  }

  /**
   * Get all race tracks from cache (optimized)
   */
  public static async getAllRaceTracks(): Promise<any[]> {
    try {
      const raceTrackIds = await redisClient.smembers('raceTracks:all');
      if (!raceTrackIds || raceTrackIds.length === 0) return [];
      
      const pipeline = redisClient.pipeline();
      raceTrackIds.forEach(id => pipeline.hgetall(`raceTrack:${id}`));
      
      const results = await pipeline.exec();
      if (!results) return [];
      
      const raceTracks = results
        .map(result => {
          const [err, data] = result as [Error | null, Record<string, string>];
          if (err || !data || Object.keys(data).length === 0) return null;
          return this.parseHashData(data);
        })
        .filter(raceTrack => raceTrack !== null);
      
      return raceTracks;
    } catch (error) {
      console.error('Error getting all race tracks:', error);
      return [];
    }
  }

  /**
   * Get active race tracks from cache (optimized)
   */
  public static async getActiveRaceTracks(): Promise<any[]> {
    try {
      const allRaceTracks = await this.getAllRaceTracks();
      return allRaceTracks.filter(raceTrack => raceTrack.isActive === true);
    } catch (error) {
      console.error('Error getting active race tracks:', error);
      return [];
    }
  }

  /**
   * Get a specific race track by ID (optimized)
   */
  public static async getRaceTrackById(id: string): Promise<any | null> {
    try {
      const raceTrack = await this.getHash(`raceTrack:${id}`);
      return raceTrack;
    } catch (error) {
      console.error(`Error getting race track ${id}:`, error);
      return null;
    }
  }

  /**
   * Get season classification data (optimized)
   */
  public static async getSeasonClassification(seasonId: string): Promise<any | null> {
    try {
      const season = await this.getHash(`season:${seasonId}`);
      if (!season) return null;
      
      // Check if classification data exists in the season hash
      if (season.classification) {
        return season.classification;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting classification for season ${seasonId}:`, error);
      return null;
    }
  }

  /**
   * Get championship classification data for all seasons (optimized)
   */
  public static async getChampionshipClassification(championshipId: string): Promise<any> {
    try {
      // Get championship with seasons
      const championshipWithSeasons = await this.getChampionshipWithSeasons(championshipId);
      if (!championshipWithSeasons || !championshipWithSeasons.seasons) {
        return { championship: null, classifications: [] };
      }
      
      // Get classification data for all seasons in parallel
      const seasonKeys = championshipWithSeasons.seasons.map((season: any) => `season:${season.id}`);
      const seasonsWithClassification = await this.getMultipleHashes(seasonKeys);
      
      const classifications = seasonsWithClassification
        .map(season => {
          if (season.classification) {
            return {
              seasonId: season.id,
              seasonName: season.name,
              seasonYear: season.year,
              classification: season.classification
            };
          }
          return null;
        })
        .filter(classification => classification !== null);
      
      return {
        championship: championshipWithSeasons,
        classifications
      };
    } catch (error) {
      console.error(`Error getting championship classification for ${championshipId}:`, error);
      return { championship: null, classifications: [] };
    }
  }

  /**
   * Parse Redis Hash data and convert to proper JavaScript types
   */
  private static parseHashData(hashData: Record<string, string>): Record<string, any> {
    const parsed: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(hashData)) {
      // Convert specific fields to proper types
      if (key === 'maxPilots' || key === 'minimumAge' || key === 'ballast') {
        parsed[key] = parseInt(value, 10);
      } else if (key === 'startDate' || key === 'endDate' || key === 'date' || key === 'createdAt' || key === 'updatedAt') {
        parsed[key] = new Date(value);
      } else if (key === 'sponsors' || key === 'trackLayouts' || key === 'defaultFleets' || key === 'generalInfo' || key === 'pilots' || key === 'classification') {
        // Parse JSON string fields (including pilots and classification)
        try {
          parsed[key] = value ? JSON.parse(value) : (key === 'classification' ? null : []);
        } catch (e) {
          console.error(`Error parsing JSON for field ${key}:`, e);
          parsed[key] = key === 'classification' ? null : [];
        }
      } else if (key === 'regulationsEnabled' || key === 'isActive') {
        // Parse boolean (accepts 'true', 'false', 1, 0, or undefined)
        parsed[key] = value === 'true' || value === '1';
      } else {
        parsed[key] = value;
      }
    }
    
    return parsed;
  }

  /**
   * Get multiple values from Redis in a single pipeline operation (legacy support)
   * @deprecated Use getMultipleHashes for better performance with new Hash structure
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