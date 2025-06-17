import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService, CacheRebuildStatus } from '../cache.service';
import { createClient, RedisClientType } from 'redis';

// Mock redis
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('Cache Building Unit Tests', () => {
  let service: CacheService;
  let configService: ConfigService;
  let mockRedisClient: jest.Mocked<RedisClientType>;

  beforeEach(async () => {
    // Create mock Redis client
    mockRedisClient = {
      connect: jest.fn(),
      flushAll: jest.fn(),
      on: jest.fn(),
      set: jest.fn(),
      get: jest.fn(),
      hSet: jest.fn(),
      hGet: jest.fn(),
      hGetAll: jest.fn(),
      sAdd: jest.fn(),
      sMembers: jest.fn(),
    } as any;

    // Mock createClient to return our mock
    (createClient as jest.Mock).mockReturnValue(mockRedisClient);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => {
              const config = {
                REDIS_URL: 'redis://localhost:6379',
                REDIS_PASSWORD: 'redis',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('Cache Service Initialization', () => {
    it('should initialize with correct Redis configuration', () => {
      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        password: 'redis',
      });
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should attempt to connect to Redis on initialization', () => {
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should log successful connection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRedisClient.connect.mockResolvedValue(undefined);

      // Re-initialize to trigger connection logic
      const freshService = new (CacheService as any)(configService);

      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async operations to complete

      expect(consoleSpy).toHaveBeenCalledWith('✅ Connected to Redis');
      consoleSpy.mockRestore();
    });

    it('should handle connection errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Connection failed');
      mockRedisClient.connect.mockRejectedValue(error);

      const freshService = new (CacheService as any)(configService);

      await new Promise(resolve => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to connect to Redis:', error);
      consoleSpy.mockRestore();
    });
  });

  describe('Individual Cache Building Methods', () => {
    describe('buildEntityFactsCache', () => {
      it('should build entity facts cache successfully', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const result = await service.buildEntityFactsCache();

        expect(result).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('[Cache] Building entity facts cache...');
        consoleSpy.mockRestore();
      });

      it('should handle cache building errors', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        // Mock an error during cache building (simulate by rejecting a promise)
        const originalSetTimeout = setTimeout;
        global.setTimeout = jest.fn((callback, delay) => {
          if (delay === 3000) {
            // This is our simulated work - make it fail
            return originalSetTimeout(() => {
              (callback as any)(new Error('Cache build failed'));
            }, 0);
          }
          return originalSetTimeout(callback as any, delay);
        }) as any;

        // Create a version that fails
        const buildEntityFactsCache = async () => {
          throw new Error('Simulated cache build failure');
        };
        
        service.buildEntityFactsCache = buildEntityFactsCache;

        const result = await service.buildEntityFactsCache();

        expect(result).toBe(false);
        global.setTimeout = originalSetTimeout;
      });

      it('should simulate work for the expected duration', async () => {
        const start = Date.now();
        
        // Mock setTimeout to resolve immediately for testing
        const originalSetTimeout = setTimeout;
        global.setTimeout = jest.fn((callback, delay) => {
          expect(delay).toBe(3000); // Should simulate 3 seconds
          return originalSetTimeout(callback as any, 0);
        }) as any;

        await service.buildEntityFactsCache();

        expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
        global.setTimeout = originalSetTimeout;
      });
    });

    describe('buildEntityLineageCache', () => {
      it('should build entity lineage cache successfully', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const result = await service.buildEntityLineageCache();

        expect(result).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('[Cache] Building entity lineage cache...');
        consoleSpy.mockRestore();
      });

      it('should handle lineage cache building errors', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        service.buildEntityLineageCache = jest.fn().mockRejectedValue(new Error('Lineage build failed'));

        try {
          await service.buildEntityLineageCache();
        } catch (error) {
          expect(error.message).toBe('Lineage build failed');
        }

        consoleSpy.mockRestore();
      });
    });

    describe('buildSubtypesCache', () => {
      it('should build subtypes cache successfully', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        const result = await service.buildSubtypesCache();

        expect(result).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('[Cache] Building entity subtypes cache...');
        consoleSpy.mockRestore();
      });

      it('should handle subtypes cache building errors', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        
        service.buildSubtypesCache = jest.fn().mockRejectedValue(new Error('Subtypes build failed'));

        try {
          await service.buildSubtypesCache();
        } catch (error) {
          expect(error.message).toBe('Subtypes build failed');
        }

        consoleSpy.mockRestore();
      });
    });
  });

  describe('Cache Rebuild Orchestration', () => {
    it('should rebuild all caches in correct sequence', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Mock individual cache methods to track call order
      const buildOrderTracker: string[] = [];
      
      service.buildEntityFactsCache = jest.fn().mockImplementation(async () => {
        buildOrderTracker.push('facts');
        return true;
      });
      
      service.buildEntityLineageCache = jest.fn().mockImplementation(async () => {
        buildOrderTracker.push('lineage');
        return true;
      });
      
      service.buildSubtypesCache = jest.fn().mockImplementation(async () => {
        buildOrderTracker.push('subtypes');
        return true;
      });

      const result = await service.rebuildAllCaches();

      expect(result).toBe(true);
      expect(buildOrderTracker).toEqual(['facts', 'lineage', 'subtypes']);
      expect(service.buildEntityFactsCache).toHaveBeenCalled();
      expect(service.buildEntityLineageCache).toHaveBeenCalled();
      expect(service.buildSubtypesCache).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should update rebuild status throughout the process', async () => {
      const statusUpdates: CacheRebuildStatus[] = [];
      
      // Spy on updateRebuildStatus to track status changes
      const originalUpdateStatus = (service as any).updateRebuildStatus.bind(service);
      (service as any).updateRebuildStatus = jest.fn((update) => {
        statusUpdates.push({ ...service.getRebuildStatus(), ...update });
        return originalUpdateStatus(update);
      });

      await service.rebuildAllCaches();

      expect(statusUpdates).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'rebuilding', progress: 0 }),
          expect.objectContaining({ progress: 33 }),
          expect.objectContaining({ progress: 66 }),
          expect.objectContaining({ progress: 100 }),
          expect.objectContaining({ status: 'complete', progress: 100 }),
        ])
      );
    });

    it('should prevent concurrent rebuilds', async () => {
      // Set status to rebuilding
      (service as any).rebuildStatus = { status: 'rebuilding' };

      await expect(service.rebuildAllCaches()).rejects.toThrow('Cache rebuild already in progress');
    });

    it('should handle rebuild failures', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      service.buildEntityFactsCache = jest.fn().mockResolvedValue(false);

      const result = await service.rebuildAllCaches();

      expect(result).toBe(false);
      expect(service.getRebuildStatus().status).toBe('error');
      expect(service.getRebuildStatus().error).toBe('Failed to build entity facts cache');
      
      consoleSpy.mockRestore();
    });

    it('should handle rebuild exceptions', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      service.buildEntityFactsCache = jest.fn().mockRejectedValue(new Error('Cache explosion'));

      const result = await service.rebuildAllCaches();

      expect(result).toBe(false);
      expect(service.getRebuildStatus().status).toBe('error');
      expect(service.getRebuildStatus().error).toBe('Cache explosion');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cache Status Management', () => {
    it('should initialize with idle status', () => {
      const status = service.getRebuildStatus();
      
      expect(status.status).toBe('idle');
      expect(status.progress).toBe(0);
      expect(status.message).toBeUndefined();
      expect(status.error).toBeUndefined();
    });

    it('should update status correctly', () => {
      const updateRebuildStatus = (service as any).updateRebuildStatus.bind(service);
      
      updateRebuildStatus({
        status: 'rebuilding',
        progress: 50,
        message: 'Half way there',
      });

      const status = service.getRebuildStatus();
      expect(status.status).toBe('rebuilding');
      expect(status.progress).toBe(50);
      expect(status.message).toBe('Half way there');
    });

    it('should reset status correctly', () => {
      // Set some status first
      const updateRebuildStatus = (service as any).updateRebuildStatus.bind(service);
      updateRebuildStatus({
        status: 'error',
        progress: 75,
        message: 'Something went wrong',
        error: 'Test error',
      });

      service.resetRebuildStatus();

      const status = service.getRebuildStatus();
      expect(status.status).toBe('idle');
      expect(status.progress).toBe(0);
      expect(status.message).toBeUndefined();
      expect(status.error).toBeUndefined();
    });

    it('should return immutable status copies', () => {
      const status1 = service.getRebuildStatus();
      const status2 = service.getRebuildStatus();
      
      expect(status1).not.toBe(status2); // Different objects
      expect(status1).toEqual(status2); // Same content
      
      // Modifying returned status shouldn't affect internal state
      status1.status = 'error' as any;
      expect(service.getRebuildStatus().status).toBe('idle');
    });
  });

  describe('Cache Clearing', () => {
    it('should clear Redis cache successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockRedisClient.flushAll.mockResolvedValue(undefined);

      const result = await service.clearCache();

      expect(result.success).toBe(true);
      expect(mockRedisClient.flushAll).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('[Cache] Clearing Redis cache...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ Successfully cleared Redis cache');

      consoleSpy.mockRestore();
    });

    it('should reset rebuild status after clearing cache', async () => {
      // Set some rebuild status first
      const updateRebuildStatus = (service as any).updateRebuildStatus.bind(service);
      updateRebuildStatus({
        status: 'complete',
        progress: 100,
        message: 'All done',
      });

      mockRedisClient.flushAll.mockResolvedValue(undefined);
      await service.clearCache();

      const status = service.getRebuildStatus();
      expect(status.status).toBe('idle');
      expect(status.progress).toBe(0);
      expect(status.message).toBeUndefined();
    });

    it('should handle cache clearing errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Redis connection lost');
      mockRedisClient.flushAll.mockRejectedValue(error);

      const result = await service.clearCache();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Redis connection lost');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to clear Redis cache:', error);

      consoleSpy.mockRestore();
    });
  });

  describe('Redis Connection Handling', () => {
    it('should handle Redis connection errors during operations', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const connectionError = new Error('Redis connection lost');
      
      // Mock Redis client to simulate connection error
      mockRedisClient.flushAll.mockRejectedValue(connectionError);

      const result = await service.clearCache();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Redis connection lost');
      
      consoleSpy.mockRestore();
    });

    it('should use correct Redis configuration from environment', () => {
      expect(configService.get).toHaveBeenCalledWith('REDIS_URL', 'redis://localhost:6379');
      expect(configService.get).toHaveBeenCalledWith('REDIS_PASSWORD', 'redis');
      
      expect(createClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        password: 'redis',
      });
    });
  });

  describe('Progress Tracking', () => {
    it('should track progress through cache building phases', async () => {
      const progressUpdates: number[] = [];
      
      // Mock updateRebuildStatus to capture progress updates
      const originalUpdateStatus = (service as any).updateRebuildStatus.bind(service);
      (service as any).updateRebuildStatus = jest.fn((update) => {
        if (update.progress !== undefined) {
          progressUpdates.push(update.progress);
        }
        return originalUpdateStatus(update);
      });

      await service.rebuildAllCaches();

      expect(progressUpdates).toEqual([0, 33, 66, 100]);
    });

    it('should track detailed status messages', async () => {
      const messageUpdates: string[] = [];
      
      const originalUpdateStatus = (service as any).updateRebuildStatus.bind(service);
      (service as any).updateRebuildStatus = jest.fn((update) => {
        if (update.message) {
          messageUpdates.push(update.message);
        }
        return originalUpdateStatus(update);
      });

      await service.rebuildAllCaches();

      expect(messageUpdates).toEqual([
        'Starting cache rebuild',
        'Building entity facts cache',
        'Building entity lineage cache',
        'Building subtypes cache',
        'Cache rebuild completed successfully',
      ]);
    });
  });

  describe('Error Recovery', () => {
    it('should handle partial cache build failures gracefully', async () => {
      service.buildEntityFactsCache = jest.fn().mockResolvedValue(true);
      service.buildEntityLineageCache = jest.fn().mockResolvedValue(false); // Fail lineage
      service.buildSubtypesCache = jest.fn().mockResolvedValue(true);

      const result = await service.rebuildAllCaches();

      expect(result).toBe(false);
      expect(service.getRebuildStatus().status).toBe('error');
      expect(service.getRebuildStatus().error).toBe('Failed to build entity lineage cache');
      
      // Should have attempted facts but stopped at lineage
      expect(service.buildEntityFactsCache).toHaveBeenCalled();
      expect(service.buildEntityLineageCache).toHaveBeenCalled();
      expect(service.buildSubtypesCache).not.toHaveBeenCalled();
    });

    it('should reset to idle status on manual reset', () => {
      // Simulate error state
      const updateRebuildStatus = (service as any).updateRebuildStatus.bind(service);
      updateRebuildStatus({
        status: 'error',
        error: 'Something went wrong',
        progress: 50,
      });

      service.resetRebuildStatus();

      const status = service.getRebuildStatus();
      expect(status.status).toBe('idle');
      expect(status.error).toBeUndefined();
      expect(status.progress).toBe(0);
    });
  });
});