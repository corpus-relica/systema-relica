import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from '../neo4j.service';
import * as neo4j from 'neo4j-driver';

// Mock neo4j-driver
jest.mock('neo4j-driver');

describe('Neo4jService', () => {
  let service: Neo4jService;
  let configService: ConfigService;
  let mockDriver: jest.Mocked<neo4j.Driver>;
  let mockSession: jest.Mocked<neo4j.Session>;

  beforeEach(async () => {
    // Create mock objects
    mockSession = {
      run: jest.fn(),
      close: jest.fn(),
    } as any;

    mockDriver = {
      verifyConnectivity: jest.fn(),
      session: jest.fn(),
      close: jest.fn(),
    } as any;

    // Mock neo4j.driver function
    (neo4j.driver as jest.Mock).mockReturnValue(mockDriver);
    (neo4j.auth.basic as jest.Mock).mockReturnValue({});
    mockDriver.session.mockReturnValue(mockSession);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Neo4jService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => {
              const config = {
                NEO4J_URI: 'bolt://test:7687',
                NEO4J_USER: 'testuser',
                NEO4J_PASSWORD: 'testpass',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<Neo4jService>(Neo4jService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('Module Lifecycle', () => {
    it('should initialize connection on module init', async () => {
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.onModuleInit();

      expect(neo4j.driver).toHaveBeenCalledWith(
        'bolt://test:7687',
        expect.any(Object)
      );
      expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ Connected to Neo4j database');

      consoleSpy.mockRestore();
    });

    it('should handle connection errors during init', async () => {
      const error = new Error('Connection failed');
      mockDriver.verifyConnectivity.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to connect to Neo4j:', error);

      consoleSpy.mockRestore();
    });

    it('should close driver on module destroy', async () => {
      await service.onModuleDestroy();
      expect(mockDriver.close).toHaveBeenCalled();
    });

    it('should use default configuration values', async () => {
      // Test with ConfigService returning defaults
      (configService.get as jest.Mock) = jest.fn((key: string, defaultValue: any) => defaultValue);
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);

      await service.onModuleInit();

      expect(neo4j.driver).toHaveBeenCalledWith(
        'bolt://localhost:7687',
        expect.any(Object)
      );
    });
  });

  describe('Session Management', () => {
    it('should return session from driver', () => {
      const session = service.getSession();
      expect(mockDriver.session).toHaveBeenCalled();
      expect(session).toBe(mockSession);
    });
  });

  describe('Query Execution', () => {
    beforeEach(async () => {
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should execute query successfully', async () => {
      const mockRecord = {
        toObject: jest.fn().mockReturnValue({ id: 1, name: 'test' }),
      };
      const mockResult = {
        records: [mockRecord],
      };
      mockSession.run.mockResolvedValue(mockResult as any);

      const result = await service.executeQuery('MATCH (n) RETURN n', { param: 'value' });

      expect(result.success).toBe(true);
      expect(result.results).toEqual([{ id: 1, name: 'test' }]);
      expect(mockSession.run).toHaveBeenCalledWith('MATCH (n) RETURN n', { param: 'value' });
      expect(mockSession.close).toHaveBeenCalled();
    });

    it('should handle query execution errors', async () => {
      const error = new Error('Query failed');
      mockSession.run.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.executeQuery('INVALID QUERY');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Query failed');
      expect(consoleSpy).toHaveBeenCalledWith('Failed to execute Cypher query:', error);
      expect(mockSession.close).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should close session even if query fails', async () => {
      mockSession.run.mockRejectedValue(new Error('Query failed'));

      await service.executeQuery('INVALID QUERY');

      expect(mockSession.close).toHaveBeenCalled();
    });
  });

  describe('Database State Checking', () => {
    beforeEach(async () => {
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should detect empty database', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({ toNumber: () => 0 }),
      };
      mockSession.run.mockResolvedValue({ records: [mockRecord] } as any);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const isEmpty = await service.isDatabaseEmpty();

      expect(isEmpty).toBe(true);
      expect(mockSession.run).toHaveBeenCalledWith('MATCH (n) RETURN count(n) AS node_count LIMIT 1');
      expect(consoleSpy).toHaveBeenCalledWith('Checking if database is empty...');
      expect(consoleSpy).toHaveBeenCalledWith('Database node count: 0');

      consoleSpy.mockRestore();
    });

    it('should detect non-empty database', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({ toNumber: () => 42 }),
      };
      mockSession.run.mockResolvedValue({ records: [mockRecord] } as any);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const isEmpty = await service.isDatabaseEmpty();

      expect(isEmpty).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Database node count: 42');

      consoleSpy.mockRestore();
    });

    it('should handle missing records in count query', async () => {
      mockSession.run.mockResolvedValue({ records: [] } as any);

      const isEmpty = await service.isDatabaseEmpty();

      expect(isEmpty).toBe(true); // Should default to 0 count when no records
    });
  });

  describe('CSV Loading - Nodes', () => {
    beforeEach(async () => {
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should load nodes from CSV successfully', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({ toNumber: () => 100 }),
      };
      mockSession.run.mockResolvedValue({ records: [mockRecord] } as any);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.loadNodesFromCsv('/path/to/test.csv');

      expect(result.success).toBe(true);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('LOAD CSV WITH HEADERS'),
        { file_url: 'file:////path/to/test.csv' }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Creating nodes from CSV file')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Successfully loaded nodes from CSV file. Created/matched 100 nodes.')
      );

      consoleSpy.mockRestore();
    });

    it('should handle CSV loading errors for nodes', async () => {
      const error = new Error('CSV file not found');
      mockSession.run.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.loadNodesFromCsv('/path/to/missing.csv');

      expect(result.success).toBe(false);
      expect(result.error).toBe('CSV file not found');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load nodes from CSV file:',
        error
      );

      consoleSpy.mockRestore();
    });

    it('should use correct CSV query for nodes', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({ toNumber: () => 0 }),
      };
      mockSession.run.mockResolvedValue({ records: [mockRecord] } as any);

      await service.loadNodesFromCsv('/test.csv');

      const queryCall = mockSession.run.mock.calls[0];
      const query = queryCall[0] as string;
      
      expect(query).toContain('LOAD CSV WITH HEADERS');
      expect(query).toContain('MERGE (lh:Entity');
      expect(query).toContain('MERGE (rh:Entity');
      expect(query).toContain("toInteger(replace(line['2'], ',', ''))");
      expect(query).toContain("toInteger(replace(line['15'], ',', ''))");
    });
  });

  describe('CSV Loading - Relationships', () => {
    beforeEach(async () => {
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should load relationships from CSV successfully', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({ toNumber: () => 50 }),
      };
      mockSession.run.mockResolvedValue({ records: [mockRecord] } as any);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await service.loadRelationshipsFromCsv('/path/to/relationships.csv');

      expect(result.success).toBe(true);
      expect(mockSession.run).toHaveBeenCalledWith(
        expect.stringContaining('LOAD CSV WITH HEADERS'),
        { file_url: 'file:////path/to/relationships.csv' }
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Creating relationships from CSV file')
      );

      consoleSpy.mockRestore();
    });

    it('should handle CSV loading errors for relationships', async () => {
      const error = new Error('Invalid CSV format');
      mockSession.run.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.loadRelationshipsFromCsv('/path/to/invalid.csv');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid CSV format');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load relationships from CSV file:',
        error
      );

      consoleSpy.mockRestore();
    });

    it('should use correct CSV query for relationships', async () => {
      const mockRecord = {
        get: jest.fn().mockReturnValue({ toNumber: () => 0 }),
      };
      mockSession.run.mockResolvedValue({ records: [mockRecord] } as any);

      await service.loadRelationshipsFromCsv('/test.csv');

      const queryCall = mockSession.run.mock.calls[0];
      const query = queryCall[0] as string;
      
      expect(query).toContain('LOAD CSV WITH HEADERS');
      expect(query).toContain('MATCH (lh:Entity');
      expect(query).toContain('MATCH (rh:Entity');
      expect(query).toContain('CREATE (rel:Fact');
      expect(query).toContain('fact_uid:');
      expect(query).toContain('rel_type_uid:');
      expect(query).toContain('lh_object_uid:');
      expect(query).toContain('rh_object_uid:');
    });
  });

  describe('Retry Logic', () => {
    beforeEach(async () => {
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);
      await service.onModuleInit();
    });

    it('should retry transient errors', async () => {
      const transientError = new Error('Transient error');
      (transientError as any).code = 'Neo.TransientError';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(transientError)
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await service.withRetry(operation, 3);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(consoleSpy).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });

    it('should not retry non-transient errors', async () => {
      const permanentError = new Error('Permanent error');
      const operation = jest.fn().mockRejectedValue(permanentError);

      await expect(service.withRetry(operation, 3)).rejects.toThrow('Permanent error');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should throw last error after max retries', async () => {
      const transientError = new Error('Persistent transient error');
      (transientError as any).code = 'Neo.TransientError';
      
      const operation = jest.fn().mockRejectedValue(transientError);
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      await expect(service.withRetry(operation, 2)).rejects.toThrow('Persistent transient error');
      expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries

      consoleSpy.mockRestore();
    });

    it('should implement exponential backoff', async () => {
      const transientError = new Error('Transient error');
      (transientError as any).code = 'Neo.TransientError';
      
      const operation = jest.fn()
        .mockRejectedValueOnce(transientError)
        .mockResolvedValueOnce('success');

      // Mock setTimeout to capture timing
      const originalSetTimeout = setTimeout;
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout').mockImplementation((callback, delay) => {
        expect(delay).toBeGreaterThan(200); // Should be > base delay
        return originalSetTimeout(callback as any, 0); // Execute immediately for testing
      });

      await service.withRetry(operation, 2);

      expect(setTimeoutSpy).toHaveBeenCalledTimes(1);
      setTimeoutSpy.mockRestore();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle session creation failures', async () => {
      mockDriver.session.mockImplementation(() => {
        throw new Error('Session creation failed');
      });

      await expect(service.executeQuery('MATCH (n) RETURN n')).rejects.toThrow('Session creation failed');
    });

    it('should handle malformed query responses', async () => {
      // Mock a response with malformed records
      mockSession.run.mockResolvedValue({
        records: [{ toObject: null }], // Invalid record
      } as any);

      await expect(service.executeQuery('MATCH (n) RETURN n')).rejects.toThrow();
    });
  });

  describe('Configuration Edge Cases', () => {
    it('should handle missing environment variables gracefully', async () => {
      const emptyConfigService = {
        get: jest.fn().mockReturnValue(undefined),
      };

      const moduleWithEmptyConfig = await Test.createTestingModule({
        providers: [
          Neo4jService,
          {
            provide: ConfigService,
            useValue: emptyConfigService,
          },
        ],
      }).compile();

      const serviceWithEmptyConfig = moduleWithEmptyConfig.get<Neo4jService>(Neo4jService);
      mockDriver.verifyConnectivity.mockResolvedValue(undefined);

      await serviceWithEmptyConfig.onModuleInit();

      expect(neo4j.driver).toHaveBeenCalledWith(
        'bolt://localhost:7687', // Should use default
        expect.any(Object)
      );
    });
  });
});