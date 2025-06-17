import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SetupService } from '../../setup/setup.service';
import { Neo4jService } from '../../database/neo4j.service';
import { BatchService } from '../../batch/batch.service';
import { CacheService } from '../../cache/cache.service';
import { 
  mockWebSocketGateway, 
  setupWebSocketMockDefaults,
  getAllBroadcastCalls,
  getLastBroadcastCall,
  clearWebSocketMocks
} from '../mocks/websocket.gateway.mock';

describe('WebSocket Integration Tests', () => {
  let app: TestingModule;
  let setupService: SetupService;

  // Mock implementations for all dependencies
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
    clearWebSocketMocks();
    
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

    setupWebSocketMockDefaults();

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
    
    // Inject mock WebSocket gateway
    setupService.setWebSocketGateway(mockWebSocketGateway);

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('WebSocket Message Broadcasting', () => {
    it('should broadcast initial state on startup', async () => {
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const broadcasts = getAllBroadcastCalls();
      expect(broadcasts.length).toBeGreaterThanOrEqual(1);
      
      const initialBroadcast = broadcasts[0];
      expect(initialBroadcast.status).toBe('idle');
      expect(initialBroadcast.progress).toBe(0);
      expect(initialBroadcast.message).toBe('System is ready for setup');
    });

    it('should broadcast all state transitions during setup flow', async () => {
      setupService.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const broadcasts = getAllBroadcastCalls();
      const statuses = broadcasts.map(b => b.status);
      
      expect(statuses).toContain('checking_db');
      expect(statuses).toContain('awaiting_user_credentials');
      
      // Submit credentials to continue flow
      setupService.submitCredentials('admin', 'admin@test.com', 'password123');
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const finalBroadcasts = getAllBroadcastCalls();
      const allStatuses = finalBroadcasts.map(b => b.status);
      
      expect(allStatuses).toContain('creating_admin_user');
      expect(allStatuses).toContain('seeding_db');
      expect(allStatuses).toContain('building_caches');
      expect(allStatuses).toContain('setup_complete');
    });

    it('should broadcast error states with error information', async () => {
      mockNeo4jService.isDatabaseEmpty.mockRejectedValue(new Error('Database connection failed'));
      
      setupService.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const broadcasts = getAllBroadcastCalls();
      const errorBroadcast = broadcasts.find(b => b.status === 'error');
      
      expect(errorBroadcast).toBeDefined();
      expect(errorBroadcast.error).toContain('Database connection failed');
      expect(errorBroadcast.progress).toBe(-1);
    });

    it('should include cache building substates in broadcasts', async () => {
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const broadcasts = getAllBroadcastCalls();
      const cacheBuilding = broadcasts.filter(b => b.status === 'building_caches');
      
      expect(cacheBuilding.length).toBeGreaterThan(0);
      
      const stages = cacheBuilding.map(b => b.stage).filter(Boolean);
      expect(stages).toContain('building_facts_cache');
      expect(stages).toContain('building_lineage_cache');
      expect(stages).toContain('building_subtypes_cache');
    });
  });

  describe('Message Format Validation', () => {
    it('should broadcast messages with all required fields', async () => {
      setupService.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const lastBroadcast = getLastBroadcastCall();
      
      expect(lastBroadcast).toMatchObject({
        status: expect.any(String),
        stage: expect.anything(), // can be null
        message: expect.any(String),
        progress: expect.any(Number),
        timestamp: expect.any(String),
      });
      
      // Validate timestamp format (ISO string)
      expect(new Date(lastBroadcast.timestamp).toISOString()).toBe(lastBroadcast.timestamp);
    });

    it('should format progress values correctly', async () => {
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const broadcasts = getAllBroadcastCalls();
      
      broadcasts.forEach(broadcast => {
        if (broadcast.status === 'error') {
          expect(broadcast.progress).toBe(-1);
        } else {
          expect(broadcast.progress).toBeGreaterThanOrEqual(0);
          expect(broadcast.progress).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should include appropriate messages for each state', async () => {
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const broadcasts = getAllBroadcastCalls();
      
      const stateMessages = broadcasts.reduce((acc, b) => {
        acc[b.status] = b.message;
        return acc;
      }, {});
      
      expect(stateMessages['idle']).toContain('ready for setup');
      expect(stateMessages['checking_db']).toContain('Checking database');
      expect(stateMessages['awaiting_user_credentials']).toContain('Waiting for admin user');
    });
  });

  describe('WebSocket Error Handling', () => {
    it('should handle missing WebSocket gateway gracefully', () => {
      setupService.setWebSocketGateway(null);
      
      expect(() => setupService.startSetup()).not.toThrow();
      
      // Should still work, just without broadcasting
      const state = setupService.getSetupState();
      expect(state.status).toBe('checking_db');
    });

    it('should handle WebSocket broadcast errors gracefully', () => {
      mockWebSocketGateway.broadcastSetupUpdate.mockImplementation(() => {
        throw new Error('WebSocket error');
      });
      
      expect(() => setupService.startSetup()).not.toThrow();
      
      // Setup should continue despite WebSocket errors
      const state = setupService.getSetupState();
      expect(['checking_db', 'awaiting_user_credentials']).toContain(state.status);
    });

    it('should continue operation if WebSocket connection is lost', () => {
      mockWebSocketGateway.server.emit.mockImplementation(() => {
        throw new Error('Connection lost');
      });
      
      setupService.startSetup();
      
      // Should not affect setup operation
      const state = setupService.getSetupState();
      expect(state.status).toBe('checking_db');
    });
  });

  describe('Real-time State Updates', () => {
    it('should broadcast state updates in real-time as they occur', async () => {
      const timestampBefore = Date.now();
      
      setupService.startSetup();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const broadcasts = getAllBroadcastCalls();
      const timestampAfter = Date.now();
      
      // Should have received broadcasts quickly
      expect(broadcasts.length).toBeGreaterThan(0);
      
      broadcasts.forEach(broadcast => {
        const broadcastTime = new Date(broadcast.timestamp).getTime();
        expect(broadcastTime).toBeGreaterThanOrEqual(timestampBefore);
        expect(broadcastTime).toBeLessThanOrEqual(timestampAfter);
      });
    });

    it('should maintain chronological order of broadcasts', async () => {
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const broadcasts = getAllBroadcastCalls();
      const timestamps = broadcasts.map(b => new Date(b.timestamp).getTime());
      
      // Timestamps should be in ascending order
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
      }
    });

    it('should broadcast immediate status updates for state machine events', async () => {
      const broadcastCountBefore = getAllBroadcastCalls().length;
      
      setupService.sendEvent({ type: 'START_SETUP' });
      
      // Should broadcast almost immediately
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const broadcastCountAfter = getAllBroadcastCalls().length;
      expect(broadcastCountAfter).toBeGreaterThan(broadcastCountBefore);
    });
  });

  describe('Progress Tracking', () => {
    it('should broadcast progressive updates during cache building', async () => {
      // Track progress updates specifically during cache building
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'admin@test.com', 'password123');
      
      // Monitor broadcasts during cache building phase
      const progressUpdates: Array<{ stage: string, progress: number }> = [];
      
      const monitorInterval = setInterval(() => {
        const lastBroadcast = getLastBroadcastCall();
        if (lastBroadcast?.status === 'building_caches' && lastBroadcast.stage) {
          progressUpdates.push({
            stage: lastBroadcast.stage,
            progress: lastBroadcast.progress
          });
        }
      }, 100);
      
      await new Promise(resolve => setTimeout(resolve, 1200));
      clearInterval(monitorInterval);
      
      // Should have captured progress through different cache building stages
      const stages = progressUpdates.map(u => u.stage);
      expect(stages).toContain('building_facts_cache');
      
      // Progress should increase through stages
      const factsCacheProgress = progressUpdates
        .filter(u => u.stage === 'building_facts_cache')
        .map(u => u.progress);
      
      if (factsCacheProgress.length > 0) {
        expect(Math.max(...factsCacheProgress)).toBeGreaterThanOrEqual(40);
      }
    });

    it('should broadcast completion with 100% progress', async () => {
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setupService.submitCredentials('admin', 'admin@test.com', 'password123');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const broadcasts = getAllBroadcastCalls();
      const completionBroadcast = broadcasts.find(b => b.status === 'setup_complete');
      
      expect(completionBroadcast).toBeDefined();
      expect(completionBroadcast.progress).toBe(100);
    });
  });

  describe('Multiple Client Scenarios', () => {
    it('should broadcast to all connected clients', () => {
      const mockClient1 = { emit: jest.fn() };
      const mockClient2 = { emit: jest.fn() };
      
      // Simulate multiple clients
      mockWebSocketGateway.server.emit = jest.fn();
      
      setupService.startSetup();
      
      // Should broadcast to server (which handles multiple clients)
      expect(mockWebSocketGateway.broadcastSetupUpdate).toHaveBeenCalled();
    });

    it('should handle client connections and disconnections gracefully', () => {
      // Simulate client connection
      mockWebSocketGateway.handleConnection(jest.fn() as any);
      
      setupService.startSetup();
      
      // Should still broadcast normally
      expect(mockWebSocketGateway.broadcastSetupUpdate).toHaveBeenCalled();
      
      // Simulate client disconnection
      mockWebSocketGateway.handleDisconnect(jest.fn() as any);
      
      // Should continue broadcasting
      setupService.sendEvent({ type: 'START_SETUP' });
      expect(mockWebSocketGateway.broadcastSetupUpdate).toHaveBeenCalledTimes(2);
    });
  });

  describe('System Reset Broadcasting', () => {
    it('should broadcast state reset when system is reset', async () => {
      // First, get to a non-idle state
      setupService.startSetup();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const broadcastCountBefore = getAllBroadcastCalls().length;
      
      // Reset system
      await setupService.resetSystem();
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const broadcastCountAfter = getAllBroadcastCalls().length;
      expect(broadcastCountAfter).toBeGreaterThan(broadcastCountBefore);
      
      // Should broadcast idle state after reset
      const lastBroadcast = getLastBroadcastCall();
      expect(lastBroadcast.status).toBe('idle');
    });
  });

  describe('Custom Event Broadcasting', () => {
    it('should allow manual event sending and broadcast updates', () => {
      const broadcastCountBefore = getAllBroadcastCalls().length;
      
      setupService.sendEvent({ type: 'START_SETUP' });
      
      const broadcastCountAfter = getAllBroadcastCalls().length;
      expect(broadcastCountAfter).toBeGreaterThan(broadcastCountBefore);
    });

    it('should broadcast error events with proper error context', () => {
      const errorMessage = 'Custom test error';
      
      setupService.sendEvent({ type: 'ERROR', errorMessage });
      
      const broadcasts = getAllBroadcastCalls();
      const errorBroadcast = broadcasts.find(b => b.status === 'error');
      
      expect(errorBroadcast).toBeDefined();
      expect(errorBroadcast.error).toBe(errorMessage);
      expect(errorBroadcast.progress).toBe(-1);
    });
  });
});