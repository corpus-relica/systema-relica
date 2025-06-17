import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CacheService, CacheRebuildStatus } from '../cache.service';
import { createClient } from 'redis';

// Mock Redis client
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

const mockRedisClient = {
  connect: jest.fn(),
  flushAll: jest.fn(),
  on: jest.fn(),
  disconnect: jest.fn(),
  quit: jest.fn(),
};

const mockedCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('CacheService', () => {
  let service: CacheService;
  let configService: ConfigService;
  let module: TestingModule;

  const mockConfig = {
    REDIS_URL: 'redis://localhost:6379',
    REDIS_PASSWORD: 'testpassword',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup Redis client mock
    mockedCreateClient.mockReturnValue(mockRedisClient as any);
    mockRedisClient.connect.mockResolvedValue(undefined);
    mockRedisClient.flushAll.mockResolvedValue('OK');
    mockRedisClient.on.mockReturnValue(undefined);

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => mockConfig[key] || defaultValue),
    };

    module = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    configService = module.get<ConfigService>(ConfigService);

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should initialize Redis connection with correct configuration', () => {
      expect(mockedCreateClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        password: 'testpassword',
      });
      expect(mockRedisClient.connect).toHaveBeenCalled();
    });

    it('should use default Redis configuration when not provided', async () => {
      // Create a new service instance with different config
      const mockConfigWithDefaults = {
        get: jest.fn((key: string, defaultValue?: any) => defaultValue),
      };

      const moduleWithDefaults = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: ConfigService,
            useValue: mockConfigWithDefaults,
          },
        ],
      }).compile();

      expect(mockedCreateClient).toHaveBeenCalledWith({
        url: 'redis://localhost:6379',
        password: 'redis',
      });

      await moduleWithDefaults.close();
    });

    it('should handle Redis connection errors', () => {
      expect(mockRedisClient.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should start with idle rebuild status', () => {
      const status = service.getRebuildStatus();
      expect(status).toEqual({
        status: 'idle',
        progress: 0,
      });
    });
  });

  describe('Individual Cache Building', () => {
    describe('buildEntityFactsCache', () => {
      it('should build facts cache successfully', async () => {
        const result = await service.buildEntityFactsCache();
        expect(result).toBe(true);
      });

      it('should handle facts cache building errors', async () => {
        // Mock an implementation that throws an error
        const originalMethod = service.buildEntityFactsCache;
        service.buildEntityFactsCache = jest.fn().mockRejectedValue(new Error('Facts cache error'));

        const result = await service.buildEntityFactsCache();
        expect(result).toBe(false);

        // Restore original method
        service.buildEntityFactsCache = originalMethod;
      });
    });

    describe('buildEntityLineageCache', () => {
      it('should build lineage cache successfully', async () => {
        const result = await service.buildEntityLineageCache();
        expect(result).toBe(true);
      });

      it('should handle lineage cache building errors', async () => {
        const originalMethod = service.buildEntityLineageCache;
        service.buildEntityLineageCache = jest.fn().mockRejectedValue(new Error('Lineage cache error'));

        const result = await service.buildEntityLineageCache();
        expect(result).toBe(false);

        service.buildEntityLineageCache = originalMethod;
      });
    });

    describe('buildSubtypesCache', () => {
      it('should build subtypes cache successfully', async () => {
        const result = await service.buildSubtypesCache();
        expect(result).toBe(true);
      });

      it('should handle subtypes cache building errors', async () => {
        const originalMethod = service.buildSubtypesCache;
        service.buildSubtypesCache = jest.fn().mockRejectedValue(new Error('Subtypes cache error'));

        const result = await service.buildSubtypesCache();
        expect(result).toBe(false);

        service.buildSubtypesCache = originalMethod;
      });
    });
  });

  describe('Rebuild All Caches', () => {
    beforeEach(() => {
      // Reset rebuild status before each test
      service.resetRebuildStatus();
    });

    it('should rebuild all caches successfully', async () => {
      const result = await service.rebuildAllCaches();

      expect(result).toBe(true);
      
      const finalStatus = service.getRebuildStatus();
      expect(finalStatus.status).toBe('complete');
      expect(finalStatus.progress).toBe(100);
      expect(finalStatus.message).toBe('Cache rebuild completed successfully');
    });

    it('should update progress during rebuild process', async () => {
      const statusUpdates: CacheRebuildStatus[] = [];
      
      // Spy on the private updateRebuildStatus method
      const originalUpdate = service['updateRebuildStatus'];
      service['updateRebuildStatus'] = jest.fn((update) => {
        originalUpdate.call(service, update);
        statusUpdates.push(service.getRebuildStatus());
      });

      await service.rebuildAllCaches();

      // Should have multiple status updates with increasing progress
      expect(statusUpdates.length).toBeGreaterThan(3);
      
      const progressValues = statusUpdates.map(s => s.progress);
      expect(progressValues).toContain(0);   // Starting
      expect(progressValues).toContain(33);  // After facts cache
      expect(progressValues).toContain(66);  // After lineage cache
      expect(progressValues).toContain(100); // After completion
    });

    it('should prevent concurrent rebuilds', async () => {
      // Start first rebuild
      const firstRebuild = service.rebuildAllCaches();
      
      // Try to start second rebuild while first is running
      await expect(service.rebuildAllCaches()).rejects.toThrow('Cache rebuild already in progress');
      
      // Wait for first to complete
      await firstRebuild;
    });

    it('should handle facts cache build failure', async () => {
      // Mock facts cache to fail
      service.buildEntityFactsCache = jest.fn().mockResolvedValue(false);

      const result = await service.rebuildAllCaches();

      expect(result).toBe(false);
      
      const status = service.getRebuildStatus();
      expect(status.status).toBe('error');
      expect(status.error).toBe('Failed to build entity facts cache');
    });

    it('should handle lineage cache build failure', async () => {
      // Mock lineage cache to fail after facts succeeds
      service.buildEntityFactsCache = jest.fn().mockResolvedValue(true);
      service.buildEntityLineageCache = jest.fn().mockResolvedValue(false);

      const result = await service.rebuildAllCaches();

      expect(result).toBe(false);
      
      const status = service.getRebuildStatus();
      expect(status.status).toBe('error');
      expect(status.error).toBe('Failed to build entity lineage cache');
    });

    it('should handle subtypes cache build failure', async () => {
      // Mock subtypes cache to fail after others succeed
      service.buildEntityFactsCache = jest.fn().mockResolvedValue(true);
      service.buildEntityLineageCache = jest.fn().mockResolvedValue(true);
      service.buildSubtypesCache = jest.fn().mockResolvedValue(false);

      const result = await service.rebuildAllCaches();

      expect(result).toBe(false);
      
      const status = service.getRebuildStatus();
      expect(status.status).toBe('error');
      expect(status.error).toBe('Failed to build subtypes cache');
    });

    it('should handle exceptions during rebuild', async () => {
      // Mock facts cache to throw an exception
      service.buildEntityFactsCache = jest.fn().mockRejectedValue(new Error('Critical error'));

      const result = await service.rebuildAllCaches();

      expect(result).toBe(false);
      
      const status = service.getRebuildStatus();
      expect(status.status).toBe('error');
      expect(status.error).toBe('Critical error');
    });
  });

  describe('Cache Clearing', () => {
    it('should clear cache successfully', async () => {
      const result = await service.clearCache();

      expect(result.success).toBe(true);
      expect(mockRedisClient.flushAll).toHaveBeenCalled();
      
      // Should reset rebuild status
      const status = service.getRebuildStatus();
      expect(status.status).toBe('idle');
      expect(status.progress).toBe(0);
      expect(status.message).toBeUndefined();
      expect(status.error).toBeUndefined();
    });

    it('should handle Redis flush errors', async () => {
      mockRedisClient.flushAll.mockRejectedValue(new Error('Redis flush failed'));

      const result = await service.clearCache();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Redis flush failed');
    });
  });

  describe('Rebuild Status Management', () => {
    it('should get current rebuild status', () => {
      const status = service.getRebuildStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress');
      expect(status.status).toBe('idle');
      expect(status.progress).toBe(0);
    });

    it('should reset rebuild status correctly', () => {
      // First, set some status
      service['rebuildStatus'] = {
        status: 'error',
        progress: 50,
        message: 'Test error',
        error: 'Test error message',
      };

      service.resetRebuildStatus();

      const status = service.getRebuildStatus();
      expect(status).toEqual({
        status: 'idle',
        progress: 0,
        message: undefined,
        error: undefined,
      });
    });

    it('should return immutable status objects', () => {
      const status1 = service.getRebuildStatus();
      const status2 = service.getRebuildStatus();

      expect(status1).not.toBe(status2); // Different object instances
      expect(status1).toEqual(status2);   // But same content
      
      // Modifying returned status should not affect internal state
      status1.progress = 999;
      const status3 = service.getRebuildStatus();
      expect(status3.progress).toBe(0); // Should still be original value
    });
  });

  describe('Error Scenarios', () => {
    it('should handle Redis connection failure during initialization', async () => {
      // Create a new service with failing Redis connection
      mockRedisClient.connect.mockRejectedValue(new Error('Connection failed'));
      
      const failingModule = await Test.createTestingModule({
        providers: [
          CacheService,
          {
            provide: ConfigService,
            useValue: { get: jest.fn((key, def) => def) },
          },
        ],
      }).compile();

      // Service should still be created even if Redis fails
      const failingService = failingModule.get<CacheService>(CacheService);
      expect(failingService).toBeDefined();

      await failingModule.close();
    });

    it('should handle Redis errors during cache operations', async () => {
      // Redis errors should be caught and handled gracefully
      mockRedisClient.flushAll.mockRejectedValue(new Error('Redis operation failed'));

      const result = await service.clearCache();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Redis operation failed');
    });
  });

  describe('Cache Building Simulation', () => {
    it('should simulate work with appropriate delays', async () => {
      const startTime = Date.now();
      await service.buildEntityFactsCache();
      const endTime = Date.now();

      // Should take at least 3 seconds (simulated work)
      expect(endTime - startTime).toBeGreaterThanOrEqual(2900);
    });

    it('should simulate different work durations for different caches', async () => {
      const promises = [
        service.buildEntityFactsCache(),
        service.buildEntityLineageCache(),
        service.buildSubtypesCache(),
      ];

      const startTime = Date.now();
      await Promise.all(promises);
      const endTime = Date.now();

      // All should complete around the same time since they're the same simulation
      expect(endTime - startTime).toBeGreaterThanOrEqual(2900);
      expect(endTime - startTime).toBeLessThan(4000); // But not too much longer
    });
  });

  describe('Concurrency Handling', () => {
    it('should handle concurrent individual cache builds', async () => {
      // Individual cache builds should be able to run concurrently
      const promises = [
        service.buildEntityFactsCache(),
        service.buildEntityLineageCache(),
        service.buildSubtypesCache(),
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual([true, true, true]);
    });

    it('should prevent multiple rebuild-all operations', async () => {
      const rebuild1 = service.rebuildAllCaches();
      
      // Second rebuild should be rejected
      await expect(service.rebuildAllCaches()).rejects.toThrow('Cache rebuild already in progress');
      
      // First should still complete successfully
      await expect(rebuild1).resolves.toBe(true);
    });
  });
});