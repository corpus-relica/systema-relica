import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { Fact } from '@relica/types';
import { ArchivistClientService } from '../archivist-client/archivist-client.service';

export interface CacheRebuildStatus {
  status: 'idle' | 'rebuilding' | 'complete' | 'error';
  progress: number;
  message?: string;
  error?: string;
}

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: RedisClientType;
  private rebuildStatus: CacheRebuildStatus = {
    status: 'idle',
    progress: 0,
  };
  private webSocketGateway: any; // Avoid circular dependency

  constructor(
    private configService: ConfigService,
    private archivistClient: ArchivistClientService,
  ) {
    this.initRedisConnection();
  }

  setWebSocketGateway(gateway: any) {
    this.webSocketGateway = gateway;
  }

  private async initRedisConnection() {
    const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
    const redisPassword = this.configService.get<string>('REDIS_PASSWORD', 'redis');
    
    this.redisClient = createClient({
      url: redisUrl,
      password: redisPassword,
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
    this.logger.log('[Cache] Building entity facts cache...');
    try {
      if (!this.archivistClient.isServiceConnected()) {
        throw new Error('Archivist service is not connected');
      }

      const BATCH_SIZE = 100; // Match Clojure implementation
      let offset = 0;
      let hasMore = true;
      let totalFactsProcessed = 0;

      while (hasMore) {
        // Fetch batch of facts from Archivist using the batch endpoint
        const batchResult = await this.archivistClient.getFactsBatch({
          skip: offset,
          range: BATCH_SIZE
        });
        
        const facts = batchResult.facts || [];
        
        if (facts.length === 0) {
          hasMore = false;
          break;
        }

        // Process each fact to extract entity-fact relationships
        for (const fact of facts) {
          const { lh_object_uid, rh_object_uid, fact_uid } = fact;
          
          if (lh_object_uid && rh_object_uid && fact_uid) {
            // Add fact to both entities' facts cache
            await this.addToEntityFactsCache(lh_object_uid, fact_uid);
            await this.addToEntityFactsCache(rh_object_uid, fact_uid);
            totalFactsProcessed++;
          }
        }

        offset += BATCH_SIZE;
        
        // If we got less than BATCH_SIZE, we've reached the end
        if (facts.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      this.logger.log(`Finished building entity facts cache. Total facts processed: ${totalFactsProcessed}`);
      return true;
    } catch (error) {
      this.logger.error('Error building entity facts cache:', error);
      return false;
    }
  }

  async buildEntityLineageCache(): Promise<boolean> {
    this.logger.log('[Cache] Building entity lineage cache...');
    try {
      if (!this.archivistClient.isServiceConnected()) {
        throw new Error('Archivist service is not connected');
      }

      const BATCH_SIZE = 100; // Match Clojure implementation
      let offset = 0;
      let hasMore = true;
      let processedEntities = 0;

      while (hasMore) {
        // Fetch facts with relation types 1146 and 1726 in batches
        const batchResult = await this.archivistClient.getFactsBatch({
          skip: offset,
          range: BATCH_SIZE,
          relTypeUids: [1146, 1726] // Specialization relation types
        });
        
        const facts = batchResult.facts || [];
        
        if (facts.length === 0) {
          hasMore = false;
          break;
        }

        // Process each fact for lineage cache
        for (const fact of facts) {
          const { lh_object_uid } = fact;
          
          if (lh_object_uid) {
            // Get lineage for the entity using the dedicated lineage endpoint
            const lineage = await this.archivistClient.getEntityLineageViaEndpoint(lh_object_uid);
            
            if (lineage.length > 0) {
              // Store lineage in Redis cache
              await this.setEntityLineageCache(lh_object_uid, lineage);
            }
            
            processedEntities++;
          }
        }

        offset += BATCH_SIZE;
        
        // If we got less than BATCH_SIZE, we've reached the end
        if (facts.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      this.logger.log(`Finished building entity lineage cache. Processed ${processedEntities} entities`);
      return true;
    } catch (error) {
      this.logger.error('Error building entity lineage cache:', error);
      return false;
    }
  }

  async buildSubtypesCache(): Promise<boolean> {
    this.logger.log('[Cache] Building entity subtypes cache...');
    try {
      if (!this.archivistClient.isServiceConnected()) {
        throw new Error('Archivist service is not connected');
      }

      const BATCH_SIZE = 100; // Match Clojure implementation
      let offset = 0;
      let hasMore = true;
      let processedEntities = 0;

      while (hasMore) {
        // Fetch facts with relation types 1146 and 1726 in batches (same as lineage cache)
        const batchResult = await this.archivistClient.getFactsBatch({
          skip: offset,
          range: BATCH_SIZE,
          relTypeUids: [1146, 1726] // Specialization relation types
        });
        
        const facts = batchResult.facts || [];
        
        if (facts.length === 0) {
          hasMore = false;
          break;
        }

        // Process each fact for subtypes cache
        for (const fact of facts) {
          const { lh_object_uid } = fact;
          
          if (lh_object_uid) {
            // Get lineage for the entity
            const lineage = await this.archivistClient.getEntityLineageViaEndpoint(lh_object_uid);
            
            if (lineage.length > 0) {
              // Add this entity as a descendant to all its ancestors
              for (const ancestorUid of lineage) {
                if (ancestorUid !== lh_object_uid) { // Don't add self as descendant
                  await this.addToSubtypesCache(ancestorUid, lh_object_uid);
                }
              }
            }
            
            processedEntities++;
          }
        }

        offset += BATCH_SIZE;
        
        // If we got less than BATCH_SIZE, we've reached the end
        if (facts.length < BATCH_SIZE) {
          hasMore = false;
        }
      }

      this.logger.log(`Finished building entity subtypes cache. Processed ${processedEntities} entities`);
      return true;
    } catch (error) {
      this.logger.error('Error building entity subtypes cache:', error);
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

  // =====================================================
  // REDIS CACHE STORAGE METHODS
  // =====================================================

  /**
   * Add a fact UID to an entity's facts cache
   */
  private async addToEntityFactsCache(entityUid: number, factUid: number): Promise<void> {
    try {
      const key = `entity:facts:${entityUid}`;
      await this.redisClient.sAdd(key, [factUid.toString()]);
    } catch (error) {
      this.logger.error(`Error adding fact ${factUid} to entity ${entityUid} facts cache:`, error);
    }
  }

  /**
   * Set lineage (ancestors) for an entity
   */
  private async setEntityLineageCache(entityUid: number, lineage: number[]): Promise<void> {
    try {
      const key = `entity:lineage:${entityUid}`;
      if (lineage.length > 0) {
        await this.redisClient.del(key); // Clear existing
        const lineageStrings = lineage.map(uid => uid.toString());
        await this.redisClient.rPush(key, lineageStrings);
      }
    } catch (error) {
      this.logger.error(`Error setting lineage for entity ${entityUid}:`, error);
    }
  }

  /**
   * Add a descendant to an ancestor's subtypes cache
   */
  private async addToSubtypesCache(ancestorUid: number, descendantUid: number): Promise<void> {
    try {
      const key = `entity:subtypes:${ancestorUid}`;
      await this.redisClient.sAdd(key, [descendantUid.toString()]);
    } catch (error) {
      this.logger.error(`Error adding descendant ${descendantUid} to ancestor ${ancestorUid} subtypes cache:`, error);
    }
  }

  private updateRebuildStatus(update: Partial<CacheRebuildStatus>) {
    this.rebuildStatus = { ...this.rebuildStatus, ...update };
    this.logger.log('Cache rebuild status updated:', this.rebuildStatus);
    
    // Broadcast status update via WebSocket
    if (this.webSocketGateway) {
      this.webSocketGateway.broadcastCacheUpdate(this.rebuildStatus);
    }
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
    
    // Broadcast status update via WebSocket
    if (this.webSocketGateway) {
      this.webSocketGateway.broadcastCacheUpdate(this.rebuildStatus);
    }
  }

  async clearCache(): Promise<{ success: boolean; error?: string }> {
    this.logger.log('[Cache] Clearing Redis cache...');
    try {
      await this.redisClient.flushAll();
      this.logger.log('✅ Successfully cleared Redis cache');
      
      // Reset rebuild status
      this.resetRebuildStatus();
      
      return { success: true };
    } catch (error) {
      this.logger.error('❌ Failed to clear Redis cache:', error);
      return { success: false, error: error.message };
    }
  }
}
