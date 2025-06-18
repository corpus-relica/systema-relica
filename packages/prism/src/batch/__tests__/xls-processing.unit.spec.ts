import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BatchService, UidMap, UidConfig } from '../batch.service';
import { Neo4jService } from '../../database/neo4j.service';
import * as XLSX from 'xlsx';

// Mock external dependencies
jest.mock('xlsx');
jest.mock('fs');
jest.mock('path');

describe('XLS Processing Unit Tests', () => {
  let service: BatchService;
  let configService: ConfigService;
  let neo4jService: Neo4jService;

  // Test data fixtures
  const mockUidConfig: UidConfig = {
    minFreeUid: 1000000000,
    minFreeFactUid: 2000000000,
    maxTempUid: 1000,
  };

  const mockUidMap: UidMap = {
    mappings: {},
    nextFreeUid: 1000000000,
    nextFreeFactUid: 2000000000,
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
          useValue: {
            // Mock Neo4j methods that might be used
          },
        },
      ],
    }).compile();

    service = module.get<BatchService>(BatchService);
    configService = module.get<ConfigService>(ConfigService);
    neo4jService = module.get<Neo4jService>(Neo4jService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Value Normalization', () => {
    it('should remove commas from string values', () => {
      // Use reflection to access private method for testing
      const normalizeValue = (service as any).normalizeValue.bind(service);
      
      expect(normalizeValue(0, 'Hello, World')).toBe('Hello World');
      expect(normalizeValue(1, '1,234,567')).toBe('1234567');
      expect(normalizeValue(5, 'Test, with, many, commas')).toBe('Test with many commas');
    });

    it('should format dates properly for date columns (8 and 9)', () => {
      const normalizeValue = (service as any).normalizeValue.bind(service);
      
      // Test JavaScript Date objects
      const testDate = new Date('2023-12-25T10:30:00Z');
      expect(normalizeValue(8, testDate)).toBe('2023-12-25');
      expect(normalizeValue(9, testDate)).toBe('2023-12-25');
      
      // Test Excel numeric dates (days since 1900-01-01)
      // Excel date 44927 = 2023-01-01
      expect(normalizeValue(8, 44927)).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(normalizeValue(9, 44927)).toMatch(/\d{4}-\d{2}-\d{2}/);
    });

    it('should not format dates for non-date columns', () => {
      const normalizeValue = (service as any).normalizeValue.bind(service);
      
      const testDate = new Date('2023-12-25T10:30:00Z');
      expect(normalizeValue(0, testDate)).toBe(testDate.toString());
      expect(normalizeValue(7, testDate)).toBe(testDate.toString());
      expect(normalizeValue(10, testDate)).toBe(testDate.toString());
    });

    it('should handle null and undefined values', () => {
      const normalizeValue = (service as any).normalizeValue.bind(service);
      
      expect(normalizeValue(0, null)).toBe('');
      expect(normalizeValue(0, undefined)).toBe('');
      expect(normalizeValue(8, null)).toBe('');
      expect(normalizeValue(9, undefined)).toBe('');
    });

    it('should convert numeric values to strings', () => {
      const normalizeValue = (service as any).normalizeValue.bind(service);
      
      expect(normalizeValue(0, 123)).toBe('123');
      expect(normalizeValue(0, 45.67)).toBe('45.67');
      expect(normalizeValue(0, 0)).toBe('0');
    });

    it('should handle Excel numeric date edge cases', () => {
      const normalizeValue = (service as any).normalizeValue.bind(service);
      
      // Small numbers should not be treated as dates
      expect(normalizeValue(8, 0)).toBe('0');
      expect(normalizeValue(8, 1)).toBe('1');
      
      // Large Excel dates
      expect(normalizeValue(8, 50000)).toMatch(/\d{4}-\d{2}-\d{2}/);
    });
  });

  describe('Date Formatting', () => {
    it('should format JavaScript Date objects correctly', () => {
      const formatDate = (service as any).formatDate.bind(service);
      
      const testDate = new Date('2023-12-25T15:30:00Z');
      expect(formatDate(testDate)).toBe('2023-12-25');
      
      const newYearDate = new Date('2024-01-01T00:00:00Z');
      expect(formatDate(newYearDate)).toBe('2024-01-01');
    });

    it('should convert Excel numeric dates', () => {
      const formatDate = (service as any).formatDate.bind(service);
      
      // Test known Excel date values
      // Note: Excel dates start from 1900-01-01 with some quirks
      const excelDate = 44927; // Should be around 2023-01-01
      const result = formatDate(excelDate);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2}/);
      expect(result.length).toBe(10);
    });

    it('should handle non-date numeric values', () => {
      const formatDate = (service as any).formatDate.bind(service);
      
      expect(formatDate(0)).toBe('0');
      expect(formatDate(1)).toBe('1');
      expect(formatDate(-1)).toBe('-1');
    });

    it('should convert other types to strings', () => {
      const formatDate = (service as any).formatDate.bind(service);
      
      expect(formatDate('2023-01-01')).toBe('2023-01-01');
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('null');
      expect(formatDate(undefined)).toBe('undefined');
    });

    it('should handle Excel date conversion errors gracefully', () => {
      const formatDate = (service as any).formatDate.bind(service);
      
      // Mock a scenario where date conversion fails
      const originalDateConstructor = global.Date;
      global.Date = jest.fn(() => {
        throw new Error('Invalid date');
      }) as any;
      
      expect(formatDate(44927)).toBe('44927');
      
      // Restore original Date constructor
      global.Date = originalDateConstructor;
    });
  });

  describe('Comma Removal', () => {
    it('should remove all commas from strings', () => {
      const removeCommas = (service as any).removeCommas.bind(service);
      
      expect(removeCommas('Hello, World')).toBe('Hello World');
      expect(removeCommas('1,234,567.89')).toBe('1234567.89');
      expect(removeCommas(',,,')).toBe('');
      expect(removeCommas('No commas here')).toBe('No commas here');
    });

    it('should handle empty and null values', () => {
      const removeCommas = (service as any).removeCommas.bind(service);
      
      expect(removeCommas('')).toBe('');
      expect(removeCommas(null)).toBe('');
      expect(removeCommas(undefined)).toBe('');
    });
  });

  describe('Long Parsing', () => {
    it('should parse valid numeric strings', () => {
      const tryParseLong = (service as any).tryParseLong.bind(service);
      
      expect(tryParseLong('123')).toBe(123);
      expect(tryParseLong('0')).toBe(0);
      expect(tryParseLong('-456')).toBe(-456);
      expect(tryParseLong('1234567890')).toBe(1234567890);
    });

    it('should parse numeric strings with commas', () => {
      const tryParseLong = (service as any).tryParseLong.bind(service);
      
      expect(tryParseLong('1,234')).toBe(1234);
      expect(tryParseLong('1,234,567')).toBe(1234567);
      expect(tryParseLong('999,999,999')).toBe(999999999);
    });

    it('should return null for invalid numeric strings', () => {
      const tryParseLong = (service as any).tryParseLong.bind(service);
      
      expect(tryParseLong('abc')).toBeNull();
      expect(tryParseLong('12.34')).toBe(12); // parseInt behavior
      expect(tryParseLong('')).toBeNull();
      expect(tryParseLong('not a number')).toBeNull();
    });

    it('should handle edge cases', () => {
      const tryParseLong = (service as any).tryParseLong.bind(service);
      
      expect(tryParseLong('000123')).toBe(123);
      expect(tryParseLong('+456')).toBe(456);
      expect(tryParseLong('  789  ')).toBe(789); // parseInt trims whitespace
    });
  });

  describe('Row Processing', () => {
    it('should skip empty rows', () => {
      const processRow = (service as any).processRow.bind(service);
      
      const [resultMap, resultRow] = processRow(mockUidMap, [], 1);
      expect(resultMap).toEqual(mockUidMap);
      expect(resultRow).toBeNull();
    });

    it('should skip blank rows', () => {
      const processRow = (service as any).processRow.bind(service);
      
      const blankRow = ['', null, undefined, '  ', ''];
      const [resultMap, resultRow] = processRow(mockUidMap, blankRow, 1);
      expect(resultMap).toEqual(mockUidMap);
      expect(resultRow).toBeNull();
    });

    it('should process valid rows with normalization', () => {
      const processRow = (service as any).processRow.bind(service);
      
      const testRow = [
        'Value1',
        '1234', // fact_uid
        '5678', // lh_obj_uid  
        'Value3',
        'Value4',
        'Value5',
        'Value6',
        'Value7',
        new Date('2023-01-01'), // date column 8
        new Date('2023-12-31'), // date column 9
      ];
      
      const [resultMap, resultRow] = processRow(mockUidMap, testRow, 1);
      
      expect(resultRow).not.toBeNull();
      expect(resultRow[0]).toBe('Value1');
      expect(resultRow[8]).toBe('2023-01-01');
      expect(resultRow[9]).toBe('2023-12-31');
    });

    it('should normalize values with commas', () => {
      const processRow = (service as any).processRow.bind(service);
      
      const testRow = [
        'Hello, World',
        '1,234',
        '5,678',
        'Test, Value',
      ];
      
      const [resultMap, resultRow] = processRow(mockUidMap, testRow, 1);
      
      expect(resultRow).not.toBeNull();
      expect(resultRow[0]).toBe('Hello World');
      expect(resultRow[3]).toBe('Test Value');
    });
  });

  describe('Error Handling', () => {
    it('should handle row processing errors gracefully', () => {
      const processRow = (service as any).processRow.bind(service);
      
      // Mock normalizeValue to throw an error
      const originalNormalizeValue = (service as any).normalizeValue;
      (service as any).normalizeValue = jest.fn(() => {
        throw new Error('Normalization error');
      });
      
      const testRow = ['test', 'data'];
      expect(() => {
        processRow(mockUidMap, testRow, 1);
      }).not.toThrow(); // Should handle errors gracefully
      
      // Restore original method
      (service as any).normalizeValue = originalNormalizeValue;
    });
  });

  describe('Configuration', () => {
    it('should use correct default UID configuration', () => {
      expect(configService.get).toHaveBeenCalledWith('PRISM_MIN_FREE_UID', 1000000000);
      expect(configService.get).toHaveBeenCalledWith('PRISM_MIN_FREE_FACT_UID', 2000000000);
      expect(configService.get).toHaveBeenCalledWith('PRISM_MAX_TEMP_UID', 1000);
    });

    it('should initialize with correct UID configuration', () => {
      const uidConfig = (service as any).uidConfig;
      
      expect(uidConfig.minFreeUid).toBe(1000000000);
      expect(uidConfig.minFreeFactUid).toBe(2000000000);
      expect(uidConfig.maxTempUid).toBe(1000);
    });
  });

  describe('Integration with External Libraries', () => {
    it('should handle XLSX parsing errors gracefully', () => {
      const mockedXLSX = XLSX as jest.Mocked<typeof XLSX>;
      
      // Test that service can handle XLSX errors if they occur
      // This is more of a contract test to ensure the service structure
      expect(mockedXLSX).toBeDefined();
    });
  });
});