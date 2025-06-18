import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BatchService, UidMap, UidConfig } from '../batch.service';
import { Neo4jService } from '../../database/neo4j.service';

describe('UID Resolution Unit Tests', () => {
  let service: BatchService;
  let configService: ConfigService;

  const mockUidConfig: UidConfig = {
    minFreeUid: 1000000000,
    minFreeFactUid: 2000000000,
    maxTempUid: 1000,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue: any) => {
              const config = {
                PRISM_MIN_FREE_UID: 1000000000,
                PRISM_MIN_FREE_FACT_UID: 2000000000,
                PRISM_MAX_TEMP_UID: 1000,
              };
              return config[key] || defaultValue;
            }),
          },
        },
        {
          provide: Neo4jService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  describe('Temporary UID Detection', () => {
    it('should identify temporary UIDs below maxTempUid threshold', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Row with temp UID in fact_uid position (index 1)
      const row = ['value0', '123', 'value2'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[123]).toBe(2000000000); // Fact UID mapped
      expect(resultRow[1]).toBe('2000000000');
      expect(resultMap.nextFreeFactUid).toBe(2000000001);
    });

    it('should not modify UIDs above maxTempUid threshold', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Row with permanent UID (above threshold)
      const row = ['value0', '1000000500', 'value2'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[1000000500]).toBeUndefined();
      expect(resultRow[1]).toBe('1000000500'); // Unchanged
      expect(resultMap.nextFreeUid).toBe(1000000000); // Unchanged
      expect(resultMap.nextFreeFactUid).toBe(2000000000); // Unchanged
    });
  });

  describe('UID Column Mapping', () => {
    it('should map fact UIDs to nextFreeFactUid range', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Fact UID is at index 1
      const row = ['value0', '100', 'value2'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[100]).toBe(2000000000);
      expect(resultRow[1]).toBe('2000000000');
      expect(resultMap.nextFreeFactUid).toBe(2000000001);
      expect(resultMap.nextFreeUid).toBe(1000000000); // Unchanged
    });

    it('should map object UIDs to nextFreeUid range', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Object UID is at index 2 (lh_obj_uid)
      const row = ['value0', 'value1', '200', Array(13).fill('value'), 'value15'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[200]).toBe(1000000000);
      expect(resultRow[2]).toBe('1000000000');
      expect(resultMap.nextFreeUid).toBe(1000000001);
      expect(resultMap.nextFreeFactUid).toBe(2000000000); // Unchanged
    });

    it('should handle rh_obj_uid column (index 15)', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Create row with temp UID at index 15 (rh_obj_uid)
      const row = Array(16).fill('value');
      row[15] = '300';
      
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[300]).toBe(1000000000);
      expect(resultRow[15]).toBe('1000000000');
      expect(resultMap.nextFreeUid).toBe(1000000001);
    });

    it('should handle rel_type_uid column (index 60)', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Create row with temp UID at index 60 (rel_type_uid)
      const row = Array(61).fill('value');
      row[60] = '400';
      
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[400]).toBe(1000000000);
      expect(resultRow[60]).toBe('1000000000');
      expect(resultMap.nextFreeUid).toBe(1000000001);
    });
  });

  describe('UID Mapping Reuse', () => {
    it('should reuse existing UID mappings', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: { 123: 1000000005 },
        nextFreeUid: 1000000010,
        nextFreeFactUid: 2000000010,
      };

      // Row with already-mapped temp UID
      const row = ['value0', 'value1', '123'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[123]).toBe(1000000005); // Unchanged
      expect(resultRow[2]).toBe('1000000005');
      expect(resultMap.nextFreeUid).toBe(1000000010); // Unchanged
      expect(resultMap.nextFreeFactUid).toBe(2000000010); // Unchanged
    });

    it('should handle multiple temp UIDs in same row', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Row with multiple temp UIDs
      const row = Array(61).fill('value');
      row[1] = '100'; // fact_uid
      row[2] = '200'; // lh_obj_uid
      row[15] = '300'; // rh_obj_uid
      row[60] = '400'; // rel_type_uid
      
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      // Fact UID gets fact UID range
      expect(resultMap.mappings[100]).toBe(2000000000);
      expect(resultRow[1]).toBe('2000000000');
      
      // Object UIDs get object UID range
      expect(resultMap.mappings[200]).toBe(1000000000);
      expect(resultRow[2]).toBe('1000000000');
      expect(resultMap.mappings[300]).toBe(1000000001);
      expect(resultRow[15]).toBe('1000000001');
      expect(resultMap.mappings[400]).toBe(1000000002);
      expect(resultRow[60]).toBe('1000000002');

      // Counters incremented correctly
      expect(resultMap.nextFreeFactUid).toBe(2000000001);
      expect(resultMap.nextFreeUid).toBe(1000000003);
    });

    it('should mix new and existing mappings', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: { 100: 2000000005, 200: 1000000005 },
        nextFreeUid: 1000000010,
        nextFreeFactUid: 2000000010,
      };

      const row = Array(61).fill('value');
      row[1] = '100'; // existing fact mapping
      row[2] = '200'; // existing object mapping
      row[15] = '300'; // new object UID
      
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      // Existing mappings reused
      expect(resultRow[1]).toBe('2000000005');
      expect(resultRow[2]).toBe('1000000005');
      
      // New mapping created
      expect(resultMap.mappings[300]).toBe(1000000010);
      expect(resultRow[15]).toBe('1000000010');
      
      // Only object UID counter incremented
      expect(resultMap.nextFreeUid).toBe(1000000011);
      expect(resultMap.nextFreeFactUid).toBe(2000000010); // Unchanged
    });
  });

  describe('UID Parsing and Validation', () => {
    it('should handle non-numeric values in UID columns', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Row with non-numeric values in UID columns
      const row = ['value0', 'not-a-number', 'also-not-a-number'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultRow[1]).toBe('not-a-number'); // Unchanged
      expect(resultRow[2]).toBe('also-not-a-number'); // Unchanged
      expect(Object.keys(resultMap.mappings)).toHaveLength(0);
    });

    it('should handle numeric strings with commas', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Row with comma-formatted temp UID
      const row = ['value0', '1,23', 'value2']; // "123" with comma
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[123]).toBe(2000000000);
      expect(resultRow[1]).toBe('2000000000');
    });

    it('should handle zero and negative UIDs correctly', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Row with zero UID (should be mapped as it's < maxTempUid)
      const row = ['value0', '0', 'value2'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap.mappings[0]).toBe(2000000000);
      expect(resultRow[1]).toBe('2000000000');
    });

    it('should handle boundary values at maxTempUid', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Test exactly at maxTempUid boundary (999 < 1000, 1000 >= 1000)
      const row1 = ['value0', '999', 'value2'];
      const [resultMap1, resultRow1] = resolveTempUids(uidMap, row1);
      expect(resultMap1.mappings[999]).toBe(2000000000);
      expect(resultRow1[1]).toBe('2000000000');

      const row2 = ['value0', '1000', 'value2'];
      const [resultMap2, resultRow2] = resolveTempUids(resultMap1, row2);
      expect(resultMap2.mappings[1000]).toBeUndefined();
      expect(resultRow2[1]).toBe('1000'); // Unchanged
    });
  });

  describe('Row Bounds Handling', () => {
    it('should handle rows shorter than UID column indices', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Short row that doesn't reach rel_type_uid column (60)
      const row = ['value0', '123', '456'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      // Should still process available columns
      expect(resultMap.mappings[123]).toBe(2000000000);
      expect(resultMap.mappings[456]).toBe(1000000000);
      expect(resultRow[1]).toBe('2000000000');
      expect(resultRow[2]).toBe('1000000000');
    });

    it('should handle empty rows gracefully', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      const row: string[] = [];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      expect(resultMap).toEqual(uidMap); // Unchanged
      expect(resultRow).toEqual([]);
    });
  });

  describe('UID Map State Management', () => {
    it('should not mutate original UID map', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const originalUidMap: UidMap = {
        mappings: { 50: 1000000050 },
        nextFreeUid: 1000000100,
        nextFreeFactUid: 2000000100,
      };

      const row = ['value0', '123', 'value2'];
      const [resultMap, resultRow] = resolveTempUids(originalUidMap, row);

      // Original map should be unchanged
      expect(originalUidMap.mappings).toEqual({ 50: 1000000050 });
      expect(originalUidMap.nextFreeUid).toBe(1000000100);
      expect(originalUidMap.nextFreeFactUid).toBe(2000000100);

      // Result map should have new mappings
      expect(resultMap.mappings[123]).toBe(2000000100);
      expect(resultMap.nextFreeFactUid).toBe(2000000101);
    });

    it('should preserve existing mappings in result', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      
      const uidMap: UidMap = {
        mappings: { 50: 1000000050, 75: 2000000075 },
        nextFreeUid: 1000000100,
        nextFreeFactUid: 2000000100,
      };

      const row = ['value0', '123', 'value2'];
      const [resultMap, resultRow] = resolveTempUids(uidMap, row);

      // Existing mappings preserved
      expect(resultMap.mappings[50]).toBe(1000000050);
      expect(resultMap.mappings[75]).toBe(2000000075);
      
      // New mapping added
      expect(resultMap.mappings[123]).toBe(2000000100);
    });
  });

  describe('Logging and Debug Information', () => {
    it('should log UID mappings for debugging', () => {
      const resolveTempUids = (service as any).resolveTempUids.bind(service);
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      const row = ['value0', '123', 'value2'];
      resolveTempUids(uidMap, row);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Mapping temp UID 123')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('to permanent UID 2000000000')
      );

      consoleSpy.mockRestore();
    });
  });
});