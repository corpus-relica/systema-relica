import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BatchService, UidConfig, UidMap, ProcessResult } from '../batch.service';
import { Neo4jService } from '../../database/neo4j.service';
import { 
  mockNeo4jService, 
  setupNeo4jMockDefaults,
  setupNeo4jForEmptyDatabase,
  setupNeo4jForNonEmptyDatabase,
  setupNeo4jForLoadingError
} from '../../__tests__/mocks/neo4j.service.mock';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

// Mock fs and XLSX modules
jest.mock('fs');
jest.mock('xlsx');

const mockedFs = fs as jest.Mocked<typeof fs>;
const mockedXLSX = XLSX as jest.Mocked<typeof XLSX>;

describe('BatchService', () => {
  let service: BatchService;
  let configService: ConfigService;
  let module: TestingModule;

  const mockConfig = {
    PRISM_MIN_FREE_UID: 1000000000,
    PRISM_MIN_FREE_FACT_UID: 2000000000,
    PRISM_MAX_TEMP_UID: 1000,
    PRISM_SEED_XLS_DIR: '/test/seed_xls',
    PRISM_CSV_OUTPUT_DIR: '/test/seed_csv',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    setupNeo4jMockDefaults();

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => mockConfig[key] || defaultValue),
    };

    module = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: Neo4jService,
          useValue: mockNeo4jService,
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    configService = module.get<ConfigService>(ConfigService);
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

    it('should load UID configuration from config service', () => {
      expect(configService.get).toHaveBeenCalledWith('PRISM_MIN_FREE_UID', 1000000000);
      expect(configService.get).toHaveBeenCalledWith('PRISM_MIN_FREE_FACT_UID', 2000000000);
      expect(configService.get).toHaveBeenCalledWith('PRISM_MAX_TEMP_UID', 1000);
    });
  });

  describe('UID Resolution', () => {
    it('should resolve temporary UIDs correctly', () => {
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Create a test row with temporary UIDs
      const row = [
        'column0',     // 0 - regular column
        '500',         // 1 - fact UID (temporary)
        '250',         // 2 - left object UID (temporary)
        'column3',     // 3 - regular column
        'column4',     // 4 - regular column
        'column5',     // 5 - regular column
        'column6',     // 6 - regular column
        'column7',     // 7 - regular column
        'column8',     // 8 - regular column
        'column9',     // 9 - regular column
        'column10',    // 10 - regular column
        'column11',    // 11 - regular column
        'column12',    // 12 - regular column
        'column13',    // 13 - regular column
        'column14',    // 14 - regular column
        '300',         // 15 - right object UID (temporary)
        ...Array(45).fill('column'), // 16-60 - regular columns
        '150',         // 60 - relation type UID (temporary)
      ];

      const [updatedMap, resolvedRow] = service['resolveTempUids'](uidMap, row);

      // Check that temporary UIDs were mapped
      expect(updatedMap.mappings[500]).toBe(2000000000); // fact UID
      expect(updatedMap.mappings[250]).toBe(1000000000); // left object UID
      expect(updatedMap.mappings[300]).toBe(1000000001); // right object UID
      expect(updatedMap.mappings[150]).toBe(1000000002); // relation type UID

      // Check that row was updated with permanent UIDs
      expect(resolvedRow[1]).toBe('2000000000'); // fact UID
      expect(resolvedRow[2]).toBe('1000000000'); // left object UID
      expect(resolvedRow[15]).toBe('1000000001'); // right object UID
      expect(resolvedRow[60]).toBe('1000000002'); // relation type UID

      // Check that non-UID columns remain unchanged
      expect(resolvedRow[0]).toBe('column0');
      expect(resolvedRow[3]).toBe('column3');
    });

    it('should reuse existing UID mappings', () => {
      const uidMap: UidMap = {
        mappings: { 500: 1000000500 },
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      const row = ['column0', '600', '500']; // 500 already mapped, 600 is new

      const [updatedMap, resolvedRow] = service['resolveTempUids'](uidMap, row);

      expect(resolvedRow[2]).toBe('1000000500'); // reused mapping
      expect(updatedMap.mappings[600]).toBe(2000000000); // new fact UID mapping
      expect(resolvedRow[1]).toBe('2000000000');
    });

    it('should not modify non-temporary UIDs', () => {
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      const row = ['column0', '2000000001', '1000000001']; // permanent UIDs

      const [updatedMap, resolvedRow] = service['resolveTempUids'](uidMap, row);

      expect(resolvedRow[1]).toBe('2000000001'); // unchanged
      expect(resolvedRow[2]).toBe('1000000001'); // unchanged
      expect(Object.keys(updatedMap.mappings)).toHaveLength(0);
    });
  });

  describe('Value Normalization', () => {
    it('should normalize string values by removing commas', () => {
      const result = service['normalizeValue'](0, 'test,value,with,commas');
      expect(result).toBe('testvaluewithcommas');
    });

    it('should format dates in columns 8 and 9', () => {
      const testDate = new Date('2023-01-15T10:30:00Z');
      
      const result8 = service['normalizeValue'](8, testDate);
      const result9 = service['normalizeValue'](9, testDate);
      
      expect(result8).toBe('2023-01-15');
      expect(result9).toBe('2023-01-15');
    });

    it('should handle Excel numeric dates', () => {
      // Excel date number for 2023-01-15
      const excelDate = 44941; // Days since 1900-01-01
      
      const result = service['normalizeValue'](8, excelDate);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/); // Should be YYYY-MM-DD format
    });

    it('should convert other values to strings', () => {
      expect(service['normalizeValue'](0, 123)).toBe('123');
      expect(service['normalizeValue'](0, null)).toBe('null');
      expect(service['normalizeValue'](0, undefined)).toBe('');
    });
  });

  describe('Row Processing', () => {
    it('should process valid rows correctly', () => {
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      const rowData = ['col1', '500', '250', 'col4']; // Contains temp UIDs

      const [updatedMap, processedRow] = service['processRow'](uidMap, rowData, 1);

      expect(processedRow).not.toBeNull();
      expect(processedRow[0]).toBe('col1');
      expect(processedRow[1]).toBe('2000000000'); // fact UID resolved
      expect(processedRow[2]).toBe('1000000000'); // object UID resolved
    });

    it('should skip empty rows', () => {
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      const [updatedMap, processedRow] = service['processRow'](uidMap, [], 1);

      expect(processedRow).toBeNull();
      expect(updatedMap).toEqual(uidMap); // unchanged
    });

    it('should skip blank rows', () => {
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      const blankRows = [
        ['', '', ''],
        [null, null, null],
        [undefined, undefined, undefined],
        ['  ', '  ', '  '],
      ];

      blankRows.forEach((rowData, index) => {
        const [, processedRow] = service['processRow'](uidMap, rowData, index);
        expect(processedRow).toBeNull();
      });
    });

    it('should handle row processing errors gracefully', () => {
      const uidMap: UidMap = {
        mappings: {},
        nextFreeUid: 1000000000,
        nextFreeFactUid: 2000000000,
      };

      // Mock an error in normalization by providing problematic data
      const problematicRow = [{ toString: () => { throw new Error('Cannot convert'); } }];

      const [updatedMap, processedRow] = service['processRow'](uidMap, problematicRow, 1);

      expect(processedRow).toBeNull();
      expect(updatedMap).toEqual(uidMap); // unchanged
    });
  });

  describe('Seed Directory Processing', () => {
    beforeEach(() => {
      // Setup default fs mocks
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.readdirSync.mockReturnValue(['test1.xls', 'test2.xlsx', 'ignore.txt'] as any);
      mockedFs.mkdirSync.mockReturnValue(undefined);
      mockedFs.writeFileSync.mockReturnValue(undefined);

      // Setup default XLSX mocks
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {},
        },
      };
      mockedXLSX.readFile.mockReturnValue(mockWorkbook);
      mockedXLSX.utils.sheet_to_json.mockReturnValue([
        ['col1', 'col2', 'col3'], // header row 0
        ['1', '2', '3'],          // column IDs row 1
        ['data1', 'data2', 'data3'], // header row 2
        ['value1', 'value2', 'value3'], // data row 0
        ['value4', 'value5', 'value6'], // data row 1
      ]);
    });

    it('should find and process XLS files', () => {
      const result = service.processSeedDirectory();

      expect(mockedFs.existsSync).toHaveBeenCalledWith('/test/seed_xls');
      expect(mockedFs.readdirSync).toHaveBeenCalledWith('/test/seed_xls');
      expect(result).toHaveLength(2); // Only .xls and .xlsx files
      expect(result[0]).toContain('0.csv');
      expect(result[1]).toContain('1.csv');
    });

    it('should create CSV output directory if it does not exist', () => {
      mockedFs.existsSync
        .mockReturnValueOnce(true)  // seed dir exists
        .mockReturnValueOnce(false); // csv dir does not exist

      service.processSeedDirectory();

      expect(mockedFs.mkdirSync).toHaveBeenCalledWith('/test/seed_csv', { recursive: true });
    });

    it('should return empty array if seed directory does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = service.processSeedDirectory();

      expect(result).toEqual([]);
      expect(mockedFs.readdirSync).not.toHaveBeenCalled();
    });

    it('should return empty array if no XLS files found', () => {
      mockedFs.readdirSync.mockReturnValue(['readme.txt', 'config.json'] as any);

      const result = service.processSeedDirectory();

      expect(result).toEqual([]);
    });

    it('should handle XLS processing errors gracefully', () => {
      mockedXLSX.readFile.mockImplementation(() => {
        throw new Error('File read error');
      });

      const result = service.processSeedDirectory();

      expect(result).toEqual([]); // Should return empty array on errors
    });

    it('should skip files with insufficient data', () => {
      mockedXLSX.utils.sheet_to_json.mockReturnValue([
        ['col1', 'col2'], // Only header rows, no data
        ['1', '2'],
      ]);

      const result = service.processSeedDirectory();

      expect(result).toEqual([]); // Should return empty array
    });
  });

  describe('Database Seeding', () => {
    beforeEach(() => {
      setupNeo4jForEmptyDatabase();
    });

    it('should seed database successfully with processed files', async () => {
      // Mock successful file processing
      jest.spyOn(service, 'processSeedDirectory').mockReturnValue([
        '/test/seed_csv/0.csv',
        '/test/seed_csv/1.csv',
      ]);

      const result = await service.seedDatabase();

      expect(result.success).toBe(true);
      expect(mockNeo4jService.isDatabaseEmpty).toHaveBeenCalled();
      expect(mockNeo4jService.loadNodesFromCsv).toHaveBeenCalledTimes(2);
      expect(mockNeo4jService.loadRelationshipsFromCsv).toHaveBeenCalledTimes(2);
    });

    it('should skip seeding if database is not empty', async () => {
      setupNeo4jForNonEmptyDatabase();

      const result = await service.seedDatabase();

      expect(result.success).toBe(true);
      expect(mockNeo4jService.loadNodesFromCsv).not.toHaveBeenCalled();
      expect(mockNeo4jService.loadRelationshipsFromCsv).not.toHaveBeenCalled();
    });

    it('should handle case with no CSV files', async () => {
      jest.spyOn(service, 'processSeedDirectory').mockReturnValue([]);

      const result = await service.seedDatabase();

      expect(result.success).toBe(false);
      expect(result.error).toBe('No CSV files to process');
    });

    it('should handle node loading errors', async () => {
      jest.spyOn(service, 'processSeedDirectory').mockReturnValue(['/test/0.csv']);
      setupNeo4jForLoadingError();

      const result = await service.seedDatabase();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load nodes');
    });

    it('should handle relationship loading errors', async () => {
      jest.spyOn(service, 'processSeedDirectory').mockReturnValue(['/test/0.csv']);
      mockNeo4jService.loadRelationshipsFromCsv.mockResolvedValue({ 
        success: false, 
        error: 'Failed to load relationships' 
      });

      const result = await service.seedDatabase();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load relationships');
    });

    it('should handle database checking errors', async () => {
      mockNeo4jService.isDatabaseEmpty.mockRejectedValue(new Error('DB connection failed'));

      const result = await service.seedDatabase();

      expect(result.success).toBe(false);
      expect(result.error).toContain('DB connection failed');
    });

    it('should handle processing exceptions', async () => {
      jest.spyOn(service, 'processSeedDirectory').mockImplementation(() => {
        throw new Error('Processing failed');
      });

      const result = await service.seedDatabase();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Processing failed');
    });
  });

  describe('Helper Functions', () => {
    describe('removeCommas', () => {
      it('should remove commas from strings', () => {
        expect(service['removeCommas']('test,value,here')).toBe('testvaluehere');
        expect(service['removeCommas']('no-commas')).toBe('no-commas');
        expect(service['removeCommas']('')).toBe('');
        expect(service['removeCommas'](null)).toBe('');
      });
    });

    describe('formatDate', () => {
      it('should format Date objects correctly', () => {
        const date = new Date('2023-01-15T10:30:00Z');
        expect(service['formatDate'](date)).toBe('2023-01-15');
      });

      it('should handle Excel numeric dates', () => {
        const excelDate = 44941; // Should convert to a valid date
        const result = service['formatDate'](excelDate);
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });

      it('should handle invalid dates', () => {
        expect(service['formatDate']('invalid')).toBe('invalid');
        expect(service['formatDate'](null)).toBe('null');
        expect(service['formatDate'](undefined)).toBe('undefined');
      });
    });

    describe('tryParseLong', () => {
      it('should parse valid integers', () => {
        expect(service['tryParseLong']('123')).toBe(123);
        expect(service['tryParseLong']('1,000')).toBe(1000); // removes commas
        expect(service['tryParseLong']('0')).toBe(0);
      });

      it('should return null for invalid integers', () => {
        expect(service['tryParseLong']('abc')).toBeNull();
        expect(service['tryParseLong']('123.45')).toBe(123); // parseInt truncates
        expect(service['tryParseLong']('')).toBeNull();
      });
    });
  });
});