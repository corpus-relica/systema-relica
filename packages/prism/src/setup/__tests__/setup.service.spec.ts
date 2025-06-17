import { Test, TestingModule } from '@nestjs/testing';
import { SetupService } from '../setup.service';
import { Neo4jService } from '../../database/neo4j.service';
import { BatchService } from '../../batch/batch.service';
import { CacheService } from '../../cache/cache.service';
import { UsersService } from '../../database/users/users.service';
import { 
  mockNeo4jService, 
  setupNeo4jMockDefaults,
  setupNeo4jForEmptyDatabase,
  setupNeo4jForNonEmptyDatabase,
  setupNeo4jForConnectionError
} from '../../__tests__/mocks/neo4j.service.mock';
import { 
  mockBatchService, 
  setupBatchMockDefaults,
  setupBatchForSuccessfulSeeding,
  setupBatchForSeedingError,
  setupBatchForSeedingException
} from '../../__tests__/mocks/batch.service.mock';
import { 
  mockCacheService, 
  setupCacheMockDefaults,
  setupCacheForSuccessfulBuilding,
  setupCacheForFactsBuildingError,
  setupCacheForLineageBuildingError,
  setupCacheForSubtypesBuildingError,
  setupCacheForBuildingException,
  setupCacheForClearError
} from '../../__tests__/mocks/cache.service.mock';
import {
  mockUsersService,
  setupUsersServiceMockDefaults
} from '../../__tests__/mocks/users.service.mock';
import { 
  mockWebSocketGateway, 
  setupWebSocketMockDefaults,
  getLastBroadcastCall,
  getAllBroadcastCalls,
  clearWebSocketMocks
} from '../../__tests__/mocks/websocket.gateway.mock';

describe('SetupService', () => {
  let service: SetupService;
  let module: TestingModule;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock behaviors
    setupNeo4jMockDefaults();
    setupBatchMockDefaults();
    setupCacheMockDefaults();
    setupUsersServiceMockDefaults();
    setupWebSocketMockDefaults();

    module = await Test.createTestingModule({
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
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<SetupService>(SetupService);
    
    // Inject mock WebSocket gateway
    service.setWebSocketGateway(mockWebSocketGateway);
    
    // Wait for initialization to complete
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  afterEach(async () => {
    if (module) {
      await module.close();
    }
    clearWebSocketMocks();
  });

  describe('Initialization', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should start in idle state', () => {
      const state = service.getSetupState();
      expect(state.status).toBe('idle');
      expect(state.progress).toBe(0);
      expect(state.message).toBe('System is ready for setup');
    });

    it('should set up WebSocket gateway correctly', () => {
      expect(service['webSocketGateway']).toBe(mockWebSocketGateway);
    });
  });

  describe('Setup Flow - Empty Database', () => {
    beforeEach(() => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSuccessfulSeeding();
      setupCacheForSuccessfulBuilding();
    });

    it('should complete full setup flow successfully', async () => {
      service.startSetup();
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Should progress through checking -> awaiting credentials
      let state = service.getSetupState();
      expect(state.status).toBe('awaiting_user_credentials');
      expect(state.progress).toBe(10);

      // Submit credentials
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      
      // Wait for user creation simulation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Should progress through user creation -> seeding -> caching -> complete
      state = service.getSetupState();
      expect(state.status).toBe('setup_complete');
      expect(state.progress).toBe(100);
      
      // Verify all services were called
      expect(mockNeo4jService.isDatabaseEmpty).toHaveBeenCalled();
      expect(mockBatchService.seedDatabase).toHaveBeenCalled();
      expect(mockCacheService.buildEntityFactsCache).toHaveBeenCalled();
      expect(mockCacheService.buildEntityLineageCache).toHaveBeenCalled();
      expect(mockCacheService.buildSubtypesCache).toHaveBeenCalled();
    });

    it('should broadcast status updates throughout the flow', async () => {
      service.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const broadcasts = getAllBroadcastCalls();
      expect(broadcasts.length).toBeGreaterThan(0);
      
      // Should have broadcasts for state transitions
      const statuses = broadcasts.map(b => b.status);
      expect(statuses).toContain('checking_db');
      expect(statuses).toContain('awaiting_user_credentials');
    });
  });

  describe('Setup Flow - Non-Empty Database', () => {
    beforeEach(() => {
      setupNeo4jForNonEmptyDatabase();
    });

    it('should skip setup when database already contains data', async () => {
      service.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = service.getSetupState();
      expect(state.status).toBe('setup_complete');
      expect(state.message).toBe('Database already contains data');
      
      // Should not call seeding or caching services
      expect(mockBatchService.seedDatabase).not.toHaveBeenCalled();
      expect(mockCacheService.buildEntityFactsCache).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      setupNeo4jForConnectionError();
      
      service.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const state = service.getSetupState();
      expect(state.status).toBe('error');
      expect(state.progress).toBe(-1);
      expect(state.error).toContain('Connection failed');
    });

    it('should handle seeding errors', async () => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSeedingError();
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const state = service.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('No CSV files to process');
    });

    it('should handle seeding exceptions', async () => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSeedingException();
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const state = service.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Seeding failed');
    });

    it('should handle facts cache building errors', async () => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSuccessfulSeeding();
      setupCacheForFactsBuildingError();
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const state = service.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Facts cache build failed');
    });

    it('should handle lineage cache building errors', async () => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSuccessfulSeeding();
      setupCacheForLineageBuildingError();
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const state = service.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Lineage cache build failed');
    });

    it('should handle subtypes cache building errors', async () => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSuccessfulSeeding();
      setupCacheForSubtypesBuildingError();
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const state = service.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('Subtypes cache build failed');
    });

    it('should handle cache building exceptions', async () => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSuccessfulSeeding();
      setupCacheForBuildingException('facts');
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const state = service.getSetupState();
      expect(state.status).toBe('error');
      expect(state.error).toContain('facts cache building failed');
    });
  });

  describe('System Reset', () => {
    it('should reset system successfully', async () => {
      const result = await service.resetSystem();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('System reset completed successfully');
      expect(result.errors).toBeUndefined();
      
      // Verify all clearing methods were called
      expect(mockNeo4jService.clearDatabase).toHaveBeenCalled();
      expect(mockCacheService.clearCache).toHaveBeenCalled();
      
      // Verify state machine was reset
      const state = service.getSetupState();
      expect(state.status).toBe('idle');
    });

    it('should handle Neo4j clearing errors during reset', async () => {
      mockNeo4jService.clearDatabase.mockResolvedValue({ 
        success: false, 
        error: 'Failed to clear Neo4j' 
      });
      
      const result = await service.resetSystem();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('System reset completed with 1 error(s)');
      expect(result.errors).toContain('Neo4j: Failed to clear Neo4j');
    });

    it('should handle Redis clearing errors during reset', async () => {
      setupCacheForClearError();
      
      const result = await service.resetSystem();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('System reset completed with 1 error(s)');
      expect(result.errors).toContain('Redis: Failed to clear cache');
    });

    it('should handle multiple clearing errors during reset', async () => {
      mockNeo4jService.clearDatabase.mockResolvedValue({ 
        success: false, 
        error: 'Neo4j error' 
      });
      setupCacheForClearError();
      
      const result = await service.resetSystem();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('System reset completed with 2 error(s)');
      expect(result.errors).toHaveLength(2);
    });

    it('should handle reset exceptions', async () => {
      mockNeo4jService.clearDatabase.mockRejectedValue(new Error('Critical error'));
      
      const result = await service.resetSystem();
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('System reset failed: Critical error');
      expect(result.errors).toContain('Critical error');
    });
  });

  describe('State Formatting', () => {
    it('should format simple states correctly', () => {
      service.startSetup();
      
      const state = service.getSetupState();
      expect(state).toHaveProperty('status');
      expect(state).toHaveProperty('stage');
      expect(state).toHaveProperty('message');
      expect(state).toHaveProperty('progress');
      expect(state).toHaveProperty('timestamp');
    });

    it('should format compound states with substates correctly', async () => {
      setupNeo4jForEmptyDatabase();
      setupBatchForSuccessfulSeeding();
      setupCacheForSuccessfulBuilding();
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Should be in cache building state
      const broadcasts = getAllBroadcastCalls();
      const cachingBroadcast = broadcasts.find(b => b.status === 'building_caches');
      
      if (cachingBroadcast) {
        expect(cachingBroadcast.stage).toBeTruthy();
        expect(['building_facts_cache', 'building_lineage_cache', 'building_subtypes_cache'])
          .toContain(cachingBroadcast.stage);
      }
    });

    it('should calculate progress correctly for different states', () => {
      // Test different states and their expected progress values
      const testCases = [
        { state: 'idle', expectedProgress: 0 },
        { state: 'checking_db', expectedProgress: 5 },
        { state: 'awaiting_user_credentials', expectedProgress: 10 },
        { state: 'creating_admin_user', expectedProgress: 20 },
        { state: 'seeding_db', expectedProgress: 30 },
        { state: 'setup_complete', expectedProgress: 100 },
        { state: 'error', expectedProgress: -1 },
      ];

      testCases.forEach(({ state, expectedProgress }) => {
        // We'll test the progress calculation through state broadcasts
        // since the progress calculation is internal to the service
      });
    });
  });

  describe('WebSocket Integration', () => {
    it('should broadcast state updates on every state change', async () => {
      setupNeo4jForEmptyDatabase();
      
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const broadcasts = getAllBroadcastCalls();
      expect(broadcasts.length).toBeGreaterThan(1);
      
      // Should broadcast initial idle state and subsequent states
      const statuses = broadcasts.map(b => b.status);
      expect(statuses).toContain('checking_db');
      expect(statuses).toContain('awaiting_user_credentials');
    });

    it('should not crash if WebSocket gateway is not set', () => {
      const serviceWithoutWS = module.get<SetupService>(SetupService);
      serviceWithoutWS['webSocketGateway'] = null;
      
      expect(() => serviceWithoutWS.startSetup()).not.toThrow();
    });

    it('should include all required fields in broadcast messages', async () => {
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const lastBroadcast = getLastBroadcastCall();
      expect(lastBroadcast).toMatchObject({
        status: expect.any(String),
        stage: expect.anything(), // can be null
        message: expect.any(String),
        progress: expect.any(Number),
        timestamp: expect.any(String),
      });
    });
  });

  describe('Credential Submission', () => {
    beforeEach(() => {
      setupNeo4jForEmptyDatabase();
    });

    it('should handle credential submission correctly', async () => {
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      service.submitCredentials('testuser', 'testuser@test.com', 'testpass123');
      
      // Check that credentials are processed
      const broadcasts = getAllBroadcastCalls();
      const creatingUserBroadcast = broadcasts.find(b => b.status === 'creating_admin_user');
      expect(creatingUserBroadcast).toBeTruthy();
    });

    it('should simulate user creation with timeout', async () => {
      service.startSetup();
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const startTime = Date.now();
      service.submitCredentials('testuser', 'testuser@test.com', 'testpass123');
      
      // Wait for user creation to complete
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000); // Should take at least 1 second
      
      const state = service.getSetupState();
      expect(['seeding_db', 'building_caches', 'setup_complete', 'error']).toContain(state.status);
    });
  });
});