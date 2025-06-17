import { Test, TestingModule } from '@nestjs/testing';
import { SetupService } from '../../setup/setup.service';
import { Neo4jService } from '../../database/neo4j.service';
import { CacheService } from '../../cache/cache.service';
import { ConfigService } from '@nestjs/config';

describe('System Reset Integration Tests', () => {
  let setupService: SetupService;
  let neo4jService: Neo4jService;
  let cacheService: CacheService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        SetupService,
        {
          provide: Neo4jService,
          useValue: {
            executeQuery: jest.fn(),
            clearDatabase: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            clearCache: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    setupService = module.get<SetupService>(SetupService);
    neo4jService = module.get<Neo4jService>(Neo4jService);
    cacheService = module.get<CacheService>(CacheService);

    jest.clearAllMocks();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('Complete System Reset', () => {
    it('should reset all system components successfully', async () => {
      // Mock successful operations
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await setupService.resetSystem();

      expect(result.success).toBe(true);
      expect(result.message).toBe('✅ System reset completed successfully');
      expect(result.errors).toBeUndefined();

      // Verify all services were called
      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DETACH DELETE')
      );
      expect(cacheService.clearCache).toHaveBeenCalled();

      // Verify logging
      expect(consoleSpy).toHaveBeenCalledWith('🚨 Starting complete system reset...');
      expect(consoleSpy).toHaveBeenCalledWith('Clearing Neo4j database...');
      expect(consoleSpy).toHaveBeenCalledWith('Clearing Redis cache...');
      expect(consoleSpy).toHaveBeenCalledWith('✅ System reset completed successfully');

      consoleSpy.mockRestore();
    });

    it('should handle Neo4j reset failures', async () => {
      // Mock Neo4j failure
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Database connection failed',
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await setupService.resetSystem();

      expect(result.success).toBe(false);
      expect(result.message).toBe('⚠️ System reset completed with 1 error(s)');
      expect(result.errors).toEqual(['Neo4j: Database connection failed']);

      // Should still attempt cache clearing
      expect(cacheService.clearCache).toHaveBeenCalled();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Reset errors:', ['Neo4j: Database connection failed']);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle Redis reset failures', async () => {
      // Mock Redis failure
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Redis connection timeout',
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await setupService.resetSystem();

      expect(result.success).toBe(false);
      expect(result.message).toBe('⚠️ System reset completed with 1 error(s)');
      expect(result.errors).toEqual(['Redis: Redis connection timeout']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Reset errors', ['Redis: Redis connection timeout']);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple service failures', async () => {
      // Mock both services failing
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Neo4j error',
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Redis error',
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await setupService.resetSystem();

      expect(result.success).toBe(false);
      expect(result.message).toBe('⚠️ System reset completed with 2 error(s)');
      expect(result.errors).toEqual(['Neo4j: Neo4j error', 'Redis: Redis error']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Reset errors:', ['Neo4j: Neo4j error', 'Redis: Redis error']);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should handle service exceptions during reset', async () => {
      // Mock Neo4j throwing an exception
      (neo4jService.executeQuery as jest.Mock).mockRejectedValue(new Error('Unexpected Neo4j error'));
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await setupService.resetSystem();

      expect(result.success).toBe(false);
      expect(result.message).toBe('System reset failed: Unexpected Neo4j error');
      expect(result.errors).toEqual(['Unexpected Neo4j error']);

      expect(consoleErrorSpy).toHaveBeenCalledWith('❌ System reset failed:', expect.any(Error));

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Reset Operation Sequence', () => {
    it('should execute reset operations in correct order', async () => {
      const operationOrder: string[] = [];

      (neo4jService.executeQuery as jest.Mock).mockImplementation(async () => {
        operationOrder.push('neo4j');
        return { success: true, results: [] };
      });

      (cacheService.clearCache as jest.Mock).mockImplementation(async () => {
        operationOrder.push('redis');
        return { success: true };
      });

      await setupService.resetSystem();

      expect(operationOrder).toEqual(['neo4j', 'redis']);
    });

    it('should continue with remaining operations even if one fails', async () => {
      const operationOrder: string[] = [];

      (neo4jService.executeQuery as jest.Mock).mockImplementation(async () => {
        operationOrder.push('neo4j');
        return { success: false, error: 'Neo4j failed' };
      });

      (cacheService.clearCache as jest.Mock).mockImplementation(async () => {
        operationOrder.push('redis');
        return { success: true };
      });

      await setupService.resetSystem();

      expect(operationOrder).toEqual(['neo4j', 'redis']);
    });
  });

  describe('Neo4j Database Clearing', () => {
    it('should execute correct Neo4j query for database clearing', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      await setupService.resetSystem();

      expect(neo4jService.executeQuery).toHaveBeenCalledWith(
        'MATCH (n) DETACH DELETE n'
      );
    });

    it('should handle Neo4j query response correctly', async () => {
      const mockResults = [
        { deleted_nodes: 100, deleted_relationships: 50 }
      ];
      
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: mockResults,
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await setupService.resetSystem();

      expect(result.success).toBe(true);
      expect(neo4jService.executeQuery).toHaveBeenCalledTimes(1);
    });
  });

  describe('Redis Cache Clearing', () => {
    it('should call cache service clear method', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      await setupService.resetSystem();

      expect(cacheService.clearCache).toHaveBeenCalledTimes(1);
      expect(cacheService.clearCache).toHaveBeenCalledWith();
    });

    it('should handle cache service response correctly', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
        details: 'All cache keys cleared',
      });

      const result = await setupService.resetSystem();

      expect(result.success).toBe(true);
    });
  });

  describe('PostgreSQL Reset Warning', () => {
    it('should log warning about PostgreSQL reset not implemented', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await setupService.resetSystem();

      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ PostgreSQL reset not implemented (requires Clarity/Aperture integration)'
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Reset Result Format', () => {
    it('should return success result with correct format', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await setupService.resetSystem();

      expect(result).toEqual({
        success: true,
        message: '✅ System reset completed successfully',
        errors: undefined,
      });
    });

    it('should return failure result with errors array', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Neo4j error',
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Redis error',
      });

      const result = await setupService.resetSystem();

      expect(result).toEqual({
        success: false,
        message: '⚠️ System reset completed with 2 error(s)',
        errors: ['Neo4j: Neo4j error', 'Redis: Redis error'],
      });
    });

    it('should return exception result with error message', async () => {
      (neo4jService.executeQuery as jest.Mock).mockRejectedValue(
        new Error('Catastrophic failure')
      );

      const result = await setupService.resetSystem();

      expect(result).toEqual({
        success: false,
        message: 'System reset failed: Catastrophic failure',
        errors: ['Catastrophic failure'],
      });
    });
  });

  describe('Logging and Monitoring', () => {
    it('should log all reset steps with appropriate messages', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: true,
        results: [],
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await setupService.resetSystem();

      const logCalls = consoleSpy.mock.calls.map(call => call[0]);
      expect(logCalls).toContain('🚨 Starting complete system reset...');
      expect(logCalls).toContain('Clearing Neo4j database...');
      expect(logCalls).toContain('Clearing Redis cache...');
      expect(logCalls).toContain('⚠️ PostgreSQL reset not implemented (requires Clarity/Aperture integration)');
      expect(logCalls).toContain('✅ System reset completed successfully');

      consoleSpy.mockRestore();
    });

    it('should log errors appropriately when services fail', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue({
        success: false,
        error: 'Database locked',
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await setupService.resetSystem();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Reset errors:', ['Neo4j: Database locked']);

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle service methods returning undefined', async () => {
      (neo4jService.executeQuery as jest.Mock).mockResolvedValue(undefined);
      (cacheService.clearCache as jest.Mock).mockResolvedValue(undefined);

      const result = await setupService.resetSystem();

      // Should handle gracefully, treating undefined as failure
      expect(result.success).toBe(false);
    });

    it('should handle services throwing non-Error objects', async () => {
      (neo4jService.executeQuery as jest.Mock).mockRejectedValue('String error');

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await setupService.resetSystem();

      expect(result.success).toBe(false);
      expect(result.message).toContain('System reset failed');

      consoleErrorSpy.mockRestore();
    });

    it('should handle concurrent reset attempts gracefully', async () => {
      // This would be more relevant if there was locking, but we can test basic concurrency
      (neo4jService.executeQuery as jest.Mock).mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return { success: true, results: [] };
      });
      (cacheService.clearCache as jest.Mock).mockResolvedValue({
        success: true,
      });

      const resetPromises = [
        setupService.resetSystem(),
        setupService.resetSystem(),
      ];

      const results = await Promise.all(resetPromises);

      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });
  });
});