import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

export interface CacheRebuildStatus {
  status: 'idle' | 'rebuilding' | 'complete' | 'error';
  progress: number;
  message?: string;
  error?: string;
}

@Injectable()
export class CacheService {
  private redisClient: RedisClientType;
  private rebuildStatus: CacheRebuildStatus = {
    status: 'idle',
    progress: 0,
  };

  constructor(private configService: ConfigService) {
    this.initRedisConnection();
  }

  private async initRedisConnection() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://redis:6379');
    
    this.redisClient = createClient({
      url: redisUrl,
    });

    this.redisClient.on('error', (err) => {
      console.error('Redis connection error:', err);
    });

    try {
      await this.redisClient.connect();
      console.log('✅ Connected to Redis');
    } catch (error) {
      console.error('❌ Failed to connect to Redis:', error);
    }
  }

  async buildEntityFactsCache(): Promise<boolean> {
    console.log('[Cache] Building entity facts cache...');
    try {
      // TODO: Implement facts cache building
      // This would:
      // 1. Fetch facts from Archivist in batches
      // 2. Process each fact to extract entity-fact relationships
      // 3. Store in Redis cache
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate work
      return true;
    } catch (error) {
      console.error('Error building entity facts cache:', error);
      return false;
    }
  }

  async buildEntityLineageCache(): Promise<boolean> {
    console.log('[Cache] Building entity lineage cache...');
    try {
      // TODO: Implement lineage cache building
      // This would:
      // 1. Fetch facts with specific rel-type-uids (1146, 1726)
      // 2. For each entity, request lineage from Archivist
      // 3. Store lineage data in Redis cache
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate work
      return true;
    } catch (error) {
      console.error('Error building entity lineage cache:', error);
      return false;
    }
  }

  async buildSubtypesCache(): Promise<boolean> {
    console.log('[Cache] Building entity subtypes cache...');
    try {
      // TODO: Implement subtypes cache building
      // This would:
      // 1. Use lineage data to build subtype relationships
      // 2. For each entity, add it as descendant to all ancestors
      // 3. Store in Redis cache
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate work
      return true;
    } catch (error) {
      console.error('Error building entity subtypes cache:', error);
      return false;
    }
  }

  async rebuildAllCaches(): Promise<boolean> {
    if (this.rebuildStatus.status === 'rebuilding') {
      throw new Error('Cache rebuild already in progress');
    }

    try {
      // Start rebuild
      this.updateRebuildStatus({
        status: 'rebuilding',
        progress: 0,
        message: 'Starting cache rebuild',
        error: undefined,
      });

      // Build entity facts cache (0-33%)
      this.updateRebuildStatus({ message: 'Building entity facts cache' });
      const factsResult = await this.buildEntityFactsCache();
      if (!factsResult) {
        throw new Error('Failed to build entity facts cache');
      }
      this.updateRebuildStatus({ progress: 33 });

      // Build entity lineage cache (33-66%)
      this.updateRebuildStatus({ message: 'Building entity lineage cache' });
      const lineageResult = await this.buildEntityLineageCache();
      if (!lineageResult) {
        throw new Error('Failed to build entity lineage cache');
      }
      this.updateRebuildStatus({ progress: 66 });

      // Build subtypes cache (66-100%)
      this.updateRebuildStatus({ message: 'Building subtypes cache' });
      const subtypesResult = await this.buildSubtypesCache();
      if (!subtypesResult) {
        throw new Error('Failed to build subtypes cache');
      }
      this.updateRebuildStatus({ progress: 100 });

      // Complete
      this.updateRebuildStatus({
        status: 'complete',
        progress: 100,
        message: 'Cache rebuild completed successfully',
      });

      console.log('Cache rebuild completed successfully');
      return true;

    } catch (error) {
      console.error('Error rebuilding caches:', error);
      this.updateRebuildStatus({
        status: 'error',
        error: error.message,
        message: 'Cache rebuild failed',
      });
      return false;
    }
  }

  private updateRebuildStatus(update: Partial<CacheRebuildStatus>) {
    this.rebuildStatus = { ...this.rebuildStatus, ...update };
    console.log('Cache rebuild status updated:', this.rebuildStatus);
    // TODO: Broadcast status update via WebSocket
  }

  getRebuildStatus(): CacheRebuildStatus {
    return { ...this.rebuildStatus };
  }

  resetRebuildStatus() {
    this.rebuildStatus = {
      status: 'idle',
      progress: 0,
      message: undefined,
      error: undefined,
    };
    // TODO: Broadcast status update via WebSocket
  }

  async clearCache(): Promise<{ success: boolean; error?: string }> {
    console.log('[Cache] Clearing Redis cache...');
    try {
      await this.redisClient.flushAll();
      console.log('✅ Successfully cleared Redis cache');
      
      // Reset rebuild status
      this.resetRebuildStatus();
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to clear Redis cache:', error);
      return { success: false, error: error.message };
    }
  }
}