import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SetupService } from '../../setup/setup.service';
import { Neo4jService } from '../../database/neo4j.service';
import { BatchService } from '../../batch/batch.service';
import { CacheService } from '../../cache/cache.service';
import { SetupModule } from '../../setup/setup.module';

describe('Setup Integration Tests', () => {
  let app: TestingModule;
  let setupService: SetupService;
  let neo4jService: Neo4jService;
  let batchService: BatchService;
  let cacheService: CacheService;

  // Mock implementations for external dependencies
  const mockNeo4jService = {
    isDatabaseEmpty: jest.fn(),
    loadNodesFromCsv: jest.fn(),
    loadRelationshipsFromCsv: jest.fn(),
    clearDatabase: jest.fn(),
    executeQuery: jest.fn(),
    withRetry: jest.fn(),
    getSession: jest.fn(),
    onModuleInit: jest.fn(),
    onModuleDestroy: jest.fn(),
  };

  const mockBatchService = {
    seedDatabase: jest.fn(),
    processSeedDirectory: jest.fn(),
  };

  const mockCacheService = {
    buildEntityFactsCache: jest.fn(),
    buildEntityLineageCache: jest.fn(),
    buildSubtypesCache: jest.fn(),
    rebuildAllCaches: jest.fn(),
    clearCache: jest.fn(),
    getRebuildStatus: jest.fn(),
    resetRebuildStatus: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config = {
        REDIS_URL: 'redis://localhost:6379',
        REDIS_PASSWORD: 'test',
        NEO4J_URI: 'bolt://localhost:7687',
        NEO4J_USER: 'neo4j',
        NEO4J_PASSWORD: 'password',
        PRISM_MIN_FREE_UID: 1000000000,
        PRISM_MIN_FREE_FACT_UID: 2000000000,
        PRISM_MAX_TEMP_UID: 1000,
        PRISM_SEED_XLS_DIR: '../../seed_xls',
        PRISM_CSV_OUTPUT_DIR: '../../seed_csv',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup default successful behaviors
    mockNeo4jService.isDatabaseEmpty.mockResolvedValue(true);
    mockNeo4jService.loadNodesFromCsv.mockResolvedValue({ success: true });
    mockNeo4jService.loadRelationshipsFromCsv.mockResolvedValue({ success: true });
    mockNeo4jService.clearDatabase.mockResolvedValue({ success: true });
    mockNeo4jService.withRetry.mockImplementation((operation) => operation());

    mockBatchService.seedDatabase.mockResolvedValue({ success: true });
    mockBatchService.processSeedDirectory.mockReturnValue(['/test/0.csv', '/test/1.csv']);

    mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
    mockCacheService.buildEntityLineageCache.mockResolvedValue(true);
    mockCacheService.buildSubtypesCache.mockResolvedValue(true);
    mockCacheService.clearCache.mockResolvedValue({ success: true });
    mockCacheService.getRebuildStatus.mockReturnValue({ status: 'idle', progress: 0 });

    app = await Test.createTestingModule({
      providers: [
        SetupService,
        {
          provide: Neo4jService,
          useValue: mockNeo4jService,
        },
        {
          provide: BatchService,
          useValue: mockBatchService,
        },
        {
          provide: CacheService,
          useValue: mockCacheService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    setupService = app.get<SetupService>(SetupService);
    neo4jService = app.get<Neo4jService>(Neo4jService);
    batchService = app.get<BatchService>(BatchService);
    cacheService = app.get<CacheService>(CacheService);

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Complete Setup Flow', () => {
    it('should complete full setup flow with empty database', async () => {
      // Start setup
      setupService.startSetup();
      
      // Wait for database check
      await new Promise(resolve => setTimeout(resolve, 100));
      
      let state = setupService.getSetupState();
      expect(state.status).toBe('awaiting_user_credentials');
      
      // Submit credentials
      setupService.submitCredentials('admin', 'password123');
      
      // Wait for full flow completion
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      state = setupService.getSetupState();
      expect(state.status).toBe('setup_complete');
      expect(state.progress).toBe(100);
      
      // Verify all services were called in correct order
      expect(mockNeo4jService.isDatabaseEmpty).toHaveBeenCalled();
      expect(mockBatchService.seedDatabase).toHaveBeenCalled();
      expect(mockCacheService.buildEntityFactsCache).toHaveBeenCalled();
      expect(mockCacheService.buildEntityLineageCache).toHaveBeenCalled();
      expect(mockCacheService.buildSubtypesCache).toHaveBeenCalled();
    });

    it('should skip setup when database is not empty', async () => {
      mockNeo4jService.isDatabaseEmpty.mockResolvedValue(false);
      
      setupService.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const state = setupService.getSetupState();
      expect(state.status).toBe('setup_complete');
      
      // Should not call seeding or caching
      expect(mockBatchService.seedDatabase).not.toHaveBeenCalled();
      expect(mockCacheService.buildEntityFactsCache).not.toHaveBeenCalled();
    });

    it('should handle database check failures gracefully', async () => {
      mockNeo4jService.isDatabaseEmpty.mockRejectedValue(new Error('Database connection failed'));
      
      setupService.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const state = setupService.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Database connection failed');
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle seeding failures and transition to error state', async () => {
      mockBatchService.seedDatabase.mockResolvedValue({ 
        success: false, 
        error: 'No seed files found' 
      });
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const state = setupService.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('No seed files found');
    });

    it('should handle cache building failures at different stages', async () => {
      // Test facts cache failure
      mockCacheService.buildEntityFactsCache.mockResolvedValue(false);
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const state = setupService.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Facts cache build failed');
    });

    it('should handle lineage cache building failures', async () => {
      mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
      mockCacheService.buildEntityLineageCache.mockResolvedValue(false);
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const state = setupService.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Lineage cache build failed');
    });

    it('should handle subtypes cache building failures', async () => {
      mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
      mockCacheService.buildEntityLineageCache.mockResolvedValue(true);
      mockCacheService.buildSubtypesCache.mockResolvedValue(false);
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const state = setupService.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Subtypes cache build failed');
    });

    it('should allow restart from error state', async () => {
      // First, cause an error
      mockNeo4jService.isDatabaseEmpty.mockRejectedValue(new Error('Initial error'));
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 200));
      
      let state = setupService.getSetupState();
      expect(state.status).toBe('error');
      
      // Fix the issue and restart
      mockNeo4jService.isDatabaseEmpty.mockResolvedValue(true);
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      state = setupService.getSetupState();
      expect(state.status).toBe('awaiting_user_credentials');
      expect(state.error).toBeUndefined();
    });
  });

  describe('System Reset Integration', () => {
    it('should reset entire system successfully', async () => {
      const result = await setupService.resetSystem();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('System reset completed successfully');
      
      // Verify all clearing operations
      expect(mockNeo4jService.clearDatabase).toHaveBeenCalled();
      expect(mockCacheService.clearCache).toHaveBeenCalled();
      
      // Verify state machine was reset
      const state = setupService.getSetupState();
      expect(state.status).toBe('idle');
    });

    it('should handle partial reset failures', async () => {
      mockNeo4jService.clearDatabase.mockResolvedValue({ 
        success: false, 
        error: 'Neo4j clear failed' 
      });
      mockCacheService.clearCache.mockResolvedValue({ 
        success: false, 
        error: 'Redis clear failed' 
      });
      
      const result = await setupService.resetSystem();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('System reset completed with 2 error(s)');
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Neo4j: Neo4j clear failed');
      expect(result.errors).toContain('Redis: Redis clear failed');
    });

    it('should reset state machine even if clearing operations fail', async () => {
      mockNeo4jService.clearDatabase.mockRejectedValue(new Error('Critical failure'));
      
      const result = await setupService.resetSystem();
      
      expect(result.success).toBe(false);
      
      // State machine should still be reset
      const state = setupService.getSetupState();
      expect(state.status).toBe('idle');
    });
  });

  describe('State Persistence and Recovery', () => {
    it('should maintain state consistency throughout flow', async () => {
      const stateSnapshots: any[] = [];
      
      // Monitor state changes by periodically checking state
      const monitor = setInterval(() => {
        stateSnapshots.push({
          timestamp: Date.now(),
          ...setupService.getSetupState()
        });
      }, 50);
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('testuser', 'testpass');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      clearInterval(monitor);
      
      // Verify state progression
      const statuses = stateSnapshots.map(s => s.status);
      expect(statuses).toContain('idle');
      expect(statuses).toContain('checking_db');
      expect(statuses).toContain('awaiting_user_credentials');
      expect(statuses).toContain('creating_admin_user');
      expect(statuses).toContain('seeding_db');
      expect(statuses).toContain('building_caches');
      expect(statuses).toContain('setup_complete');
      
      // Progress should be monotonically increasing (except for error states)
      const progressValues = stateSnapshots
        .filter(s => s.status !== 'error')
        .map(s => s.progress);
      
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }
    });

    it('should handle concurrent setup attempts correctly', async () => {
      // Start first setup
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Attempt second setup while first is running
      setupService.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Should not cause issues - state machine should handle it gracefully
      const state = setupService.getSetupState();
      expect(['awaiting_user_credentials', 'checking_db', 'error']).toContain(state.status);
    });
  });

  describe('Service Dependencies Integration', () => {
    it('should coordinate service calls in correct sequence', async () => {
      const callOrder: string[] = [];
      
      // Track call order
      mockNeo4jService.isDatabaseEmpty.mockImplementation(async () => {
        callOrder.push('neo4j.isDatabaseEmpty');
        return true;
      });
      
      mockBatchService.seedDatabase.mockImplementation(async () => {
        callOrder.push('batch.seedDatabase');
        return { success: true };
      });
      
      mockCacheService.buildEntityFactsCache.mockImplementation(async () => {
        callOrder.push('cache.buildEntityFactsCache');
        return true;
      });
      
      mockCacheService.buildEntityLineageCache.mockImplementation(async () => {
        callOrder.push('cache.buildEntityLineageCache');
        return true;
      });
      
      mockCacheService.buildSubtypesCache.mockImplementation(async () => {
        callOrder.push('cache.buildSubtypesCache');
        return true;
      });
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Verify correct sequence
      expect(callOrder).toEqual([
        'neo4j.isDatabaseEmpty',
        'batch.seedDatabase',
        'cache.buildEntityFactsCache',
        'cache.buildEntityLineageCache',
        'cache.buildSubtypesCache',
      ]);
    });

    it('should handle service dependency injection correctly', () => {
      // Verify all services are properly injected
      expect(setupService).toBeDefined();
      expect(setupService['neo4jService']).toBe(neo4jService);
      expect(setupService['batchService']).toBe(batchService);
      expect(setupService['cacheService']).toBe(cacheService);
    });
  });

  describe('Performance and Timing', () => {
    it('should complete setup within reasonable time bounds', async () => {
      const startTime = Date.now();
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete in reasonable time (accounting for simulated delays)
      expect(duration).toBeLessThan(3000); // Less than 3 seconds
      expect(duration).toBeGreaterThan(1500); // But more than 1.5 seconds due to user creation delay
    });

    it('should handle timeouts gracefully', async () => {
      // Mock a very slow operation
      mockBatchService.seedDatabase.mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 10000)); // 10 second delay
        return { success: true };
      });
      
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'password123');
      
      // Don't wait for completion - test that service doesn't hang
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const state = setupService.getSetupState();
      expect(['seeding_db', 'building_caches']).toContain(state.status);
    });
  });
});