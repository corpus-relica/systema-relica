import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from '../database/neo4j.service';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface UidConfig {
  minFreeUid: number;
  minFreeFactUid: number;
  maxTempUid: number;
}

export interface UidMap {
  mappings: Record<number, number>;
  nextFreeUid: number;
  nextFreeFactUid: number;
}

export interface ProcessResult {
  success: boolean;
  csvPath?: string;
  error?: string;
  status?: 'success' | 'error' | 'no-data';
}

@Injectable()
export class BatchService {
  private readonly uidConfig: UidConfig;

  constructor(
    private configService: ConfigService,
    private neo4jService: Neo4jService,
  ) {
    this.uidConfig = {
      minFreeUid: this.configService.get<number>('PRISM_MIN_FREE_UID', 1000000000),
      minFreeFactUid: this.configService.get<number>('PRISM_MIN_FREE_FACT_UID', 2000000000),
      maxTempUid: this.configService.get<number>('PRISM_MAX_TEMP_UID', 1000),
    };
  }

  private removeCommas(value: string): string {
    return value ? value.replace(/,/g, '') : '';
  }

  private formatDate(value: any): string {
    if (value instanceof Date) {
      return value.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // Handle Excel numeric dates
    if (typeof value === 'number' && value > 1) {
      try {
        // Excel date conversion (days since 1900-01-01)
        const excelEpoch = new Date(1900, 0, 1);
        const date = new Date(excelEpoch.getTime() + (value - 2) * 24 * 60 * 60 * 1000);
        return date.toISOString().split('T')[0];
      } catch (error) {
        return String(value);
      }
    }
    
    // Handle string date formats
    if (typeof value === 'string' && value.trim()) {
      try {
        // Try to parse common date string formats
        const trimmedValue = value.trim();
        
        // Handle formats like "21-Mar-01", "21-Mar-2001", "01-Jan-99"
        const shortDateMatch = trimmedValue.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
        if (shortDateMatch) {
          const [, day, monthAbbr, year] = shortDateMatch;
          
          // Month abbreviation mapping
          const monthMap: Record<string, string> = {
            'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
            'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
            'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
          };
          
          const monthNum = monthMap[monthAbbr] || monthMap[monthAbbr.toLowerCase()] || monthMap[monthAbbr.toUpperCase()];
          if (monthNum) {
            // Handle 2-digit years (assume 1900s for years 00-99)
            let fullYear = year;
            if (year.length === 2) {
              const yearNum = parseInt(year, 10);
              fullYear = yearNum < 50 ? `20${year}` : `19${year}`;
            }
            
            const paddedDay = day.padStart(2, '0');
            return `${fullYear}-${monthNum}-${paddedDay}`;
          }
        }
        
        // Try standard JavaScript Date parsing as fallback
        const parsedDate = new Date(trimmedValue);
        if (!isNaN(parsedDate.getTime())) {
          return parsedDate.toISOString().split('T')[0];
        }
      } catch (error) {
        // If parsing fails, return original string
        console.warn(`Failed to parse date string: ${value}`, error);
      }
    }
    
    return String(value);
  }

  private normalizeValue(colIdx: number, value: any): string {
    if ( colIdx === 21 || colIdx === 22) {
      return this.formatDate(value);
    }

    // Comma removal for strings
    if (typeof value === 'string') {
      return this.removeCommas(value);
    }

    // Default: convert to string
    return String(value || '');
  }

  private tryParseLong(value: string): number | null {
    try {
      return parseInt(this.removeCommas(value), 10);
    } catch {
      return null;
    }
  }

  private resolveTempUids(uidMap: UidMap, row: string[]): [UidMap, string[]] {
    const { maxTempUid } = this.uidConfig;
    
    // 0-based indices for UID columns (matching Clojure implementation)
    const factUidIdx = 1;
    const lhObjUidIdx = 2;
    const rhObjUidIdx = 15;
    const relTypeUidIdx = 60;
    const uidIndices = [factUidIdx, lhObjUidIdx, rhObjUidIdx, relTypeUidIdx];

    let currentRow = [...row];
    let currentMap = { ...uidMap, mappings: { ...uidMap.mappings } };

    for (const idx of uidIndices) {
      if (idx < currentRow.length) {
        const rawValue = currentRow[idx];
        const tempUid = this.tryParseLong(rawValue);

        if (tempUid !== null && tempUid < maxTempUid) {
          if (currentMap.mappings[tempUid]) {
            // Temp UID already mapped
            currentRow[idx] = String(currentMap.mappings[tempUid]);
          } else {
            // New temp UID found
            const isFactUid = idx === factUidIdx;
            const nextPermUid = isFactUid ? currentMap.nextFreeFactUid : currentMap.nextFreeUid;
            
            currentMap.mappings[tempUid] = nextPermUid;
            
            if (isFactUid) {
              currentMap.nextFreeFactUid++;
            } else {
              currentMap.nextFreeUid++;
            }
            
            currentRow[idx] = String(nextPermUid);
            console.log(`Mapping temp UID ${tempUid} (col ${idx}) to permanent UID ${nextPermUid}`);
          }
        }
      }
    }

    return [currentMap, currentRow];
  }

  private processRow(uidMap: UidMap, rowData: any[], rowIdx: number): [UidMap, string[] | null] {
    try {
      console.log(`Processing row ${rowIdx} with ${rowData.length} cells`);

      // Skip empty rows
      if (!rowData || rowData.length === 0) {
        console.log(`Skipping empty row ${rowIdx}`);
        return [uidMap, null];
      }

      // Check if row is completely blank
      const isBlank = rowData.every(cell => 
        cell === null || cell === undefined || 
        (typeof cell === 'string' && cell.trim() === '')
      );

      if (isBlank) {
        console.log(`Skipping blank row ${rowIdx}`);
        return [uidMap, null];
      }

      // 1. Normalize basic values
      const normalizedRow = rowData.map((value, idx) => this.normalizeValue(idx, value));

      // 2. Resolve temporary UIDs
      const [updatedMap, resolvedRow] = this.resolveTempUids(uidMap, normalizedRow);

      return [updatedMap, resolvedRow];
    } catch (error) {
      console.error(`Error processing row ${rowIdx}:`, error);
      return [uidMap, null];
    }
  }

  private xlsToCsv(xlsFilePath: string, csvOutputPath: string): ProcessResult {
    console.log(`Processing XLS file: ${xlsFilePath} -> ${csvOutputPath}`);
    
    try {
      const headerRowsToSkip = 3;
      
      // Read the workbook
      const workbook = XLSX.readFile(xlsFilePath);
      const sheetNames = workbook.SheetNames;
      
      console.log(`Available sheets in ${xlsFilePath}:`, sheetNames);
      
      if (sheetNames.length === 0) {
        throw new Error(`No sheets found in workbook ${xlsFilePath}`);
      }

      // Use the first sheet
      const firstSheetName = sheetNames[0];
      console.log(`Using first sheet: ${firstSheetName}`);
      const worksheet = workbook.Sheets[firstSheetName];

      // Convert to array of arrays
      const allRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
      
      if (allRows.length <= headerRowsToSkip) {
        console.warn(`Not enough rows in ${xlsFilePath}. Found ${allRows.length}, need more than ${headerRowsToSkip}`);
        return { success: false, status: 'no-data', error: 'Insufficient rows' };
      }

      // Extract header rows for column IDs (row index 1, 0-based)
      const columnIdRow = allRows[1];
      if (!columnIdRow) {
        throw new Error('Missing column ID row (expected at row index 1)');
      }

      // Convert column IDs to strings, handling numbers properly
      const columnIds = columnIdRow.map(val => {
        if (typeof val === 'number' && Number.isInteger(val)) {
          return String(val); // Format integers without decimals
        }
        return String(val || '');
      });

      console.log(`Using column IDs as CSV headers: ${columnIds.join(', ')}`);

      // Skip header rows and get data rows
      const dataRows = allRows.slice(headerRowsToSkip);

      // Initialize UID map
      let uidMap: UidMap = {
        mappings: {},
        nextFreeUid: this.uidConfig.minFreeUid,
        nextFreeFactUid: this.uidConfig.minFreeFactUid,
      };

      // Process data rows
      const processedRows: string[][] = [];
      for (let i = 0; i < dataRows.length; i++) {
        const [updatedMap, processedRow] = this.processRow(uidMap, dataRows[i], i + headerRowsToSkip);
        uidMap = updatedMap;
        
        if (processedRow) {
          processedRows.push(processedRow);
        }
      }

      if (processedRows.length === 0) {
        console.warn(`No data rows found or processed in ${xlsFilePath} after skipping ${headerRowsToSkip} headers`);
        return { success: false, status: 'no-data', error: 'No processable data rows' };
      }

      // Write CSV file
      const csvContent = [
        columnIds, // Header row with column IDs
        ...processedRows
      ].map(row => row.map(cell => {
        const cellStr = String(cell || ''); // Ensure cell is a string, handle null/undefined
        return `"${cellStr.replace(/"/g, '""')}"`;
      }).join(',')).join('\n');

      fs.writeFileSync(csvOutputPath, csvContent, 'utf8');

      console.log(`Successfully generated CSV: ${csvOutputPath} (${processedRows.length} data rows)`);
      return { success: true, status: 'success', csvPath: csvOutputPath };

    } catch (error) {
      console.error(`Failed to process XLS file: ${xlsFilePath}`, error);
      return { success: false, status: 'error', error: error.message };
    }
  }

  public processSeedDirectory(): string[] {
    const seedDir = this.configService.get<string>('PRISM_SEED_XLS_DIR', '../../seed_xls');
    const csvDir = this.configService.get<string>('PRISM_CSV_OUTPUT_DIR', '../../seed_csv');

    console.log(`Searching for XLS(X) files in: ${seedDir}`);
    console.log(`CSV output directory: ${csvDir}`);

    // Check if seed directory exists
    if (!fs.existsSync(seedDir)) {
      console.error(`Seed directory not found: ${seedDir}`);
      return [];
    }

    // Find XLS files
    const files = fs.readdirSync(seedDir);
    const xlsFiles = files.filter(file => /\.xlsx?$/i.test(file));

    if (xlsFiles.length === 0) {
      console.warn(`No XLS(X) files found in seed directory: ${seedDir}`);
      return [];
    }

    console.log(`Found ${xlsFiles.length} XLS(X) files. Processing...`);
    console.log(`XLS files:`, xlsFiles);

    // Ensure CSV output directory exists
    if (!fs.existsSync(csvDir)) {
      console.log(`Creating CSV output directory: ${csvDir}`);
      fs.mkdirSync(csvDir, { recursive: true });
    }

    // Process files
    const validResults: string[] = [];
    xlsFiles.forEach((xlsFile, idx) => {
      const csvFileName = `${idx}.csv`; // Sequential numbering (0.csv, 1.csv, etc.)
      const xlsPath = path.join(seedDir, xlsFile);
      const csvPath = path.join(csvDir, csvFileName);
      
      console.log(`Processing ${xlsPath} to ${csvPath}`);
      const result = this.xlsToCsv(xlsPath, csvPath);
      
      if (result.success && result.csvPath) {
        validResults.push(result.csvPath);
      }
    });

    console.log(`Successfully processed ${validResults.length} of ${xlsFiles.length} XLS files`);
    return validResults;
  }

  public async seedDatabase(): Promise<{ success: boolean; error?: string; statistics?: any }> {
    try {
      console.log('Starting database seeding process...');
      
      // First check if database is empty
      const isEmpty = await this.neo4jService.isDatabaseEmpty();
      if (!isEmpty) {
        console.log('Database already contains data. Skipping seeding.');
        return { success: true };
      }

      // Process XLS files to CSV
      const csvFiles = this.processSeedDirectory();
      if (csvFiles.length === 0) {
        console.log('No CSV files generated. Skipping database loading.');
        return { success: false, error: 'No CSV files to process' };
      }

      console.log(`Generated ${csvFiles.length} CSV files for import.`);

      // Track overall statistics
      const overallStats = {
        totalFiles: csvFiles.length,
        processedFiles: 0,
        failedFiles: 0,
        nodes: { loaded: 0, skipped: 0, total: 0 },
        relationships: { loaded: 0, skipped: 0, total: 0 }
      };

      // Load each CSV file into Neo4j
      for (const csvPath of csvFiles) {
        const fileName = path.basename(csvPath);
        console.log(`\n--- Processing CSV: ${fileName} ---`);

        try {
          // Load nodes
          console.log('Loading nodes...');
          const nodeResult = await this.neo4jService.loadNodesFromCsv(fileName);
          
          if (nodeResult.success) {
            overallStats.nodes.loaded += nodeResult.loaded || 0;
            overallStats.nodes.skipped += nodeResult.skipped || 0;
            overallStats.nodes.total += nodeResult.total || 0;
          } else {
            console.error(`⚠️  Failed to load nodes from ${fileName}: ${nodeResult.error}`);
            console.log('Continuing with next file...');
            overallStats.failedFiles++;
            continue;
          }

          // Load relationships
          console.log('Loading relationships...');
          const relResult = await this.neo4jService.loadRelationshipsFromCsv(fileName);
          
          if (relResult.success) {
            overallStats.relationships.loaded += relResult.loaded || 0;
            overallStats.relationships.skipped += relResult.skipped || 0;
            overallStats.relationships.total += relResult.total || 0;
          } else {
            console.error(`⚠️  Failed to load relationships from ${fileName}: ${relResult.error}`);
            console.log('Continuing with next file...');
            overallStats.failedFiles++;
            continue;
          }

          overallStats.processedFiles++;
          console.log(`✅ Finished processing CSV: ${fileName}`);

        } catch (fileError) {
          console.error(`❌ Error processing ${fileName}:`, fileError);
          overallStats.failedFiles++;
          // Continue with next file
        }
      }

      // Summary report
      console.log('\n=== Database Seeding Summary ===');
      console.log(`Files: ${overallStats.processedFiles}/${overallStats.totalFiles} successfully processed`);
      if (overallStats.failedFiles > 0) {
        console.log(`⚠️  Failed files: ${overallStats.failedFiles}`);
      }
      console.log(`\nNodes:`);
      console.log(`  - Total potential: ${overallStats.nodes.total}`);
      console.log(`  - Successfully loaded: ${overallStats.nodes.loaded}`);
      console.log(`  - Skipped: ${overallStats.nodes.skipped}`);
      console.log(`\nRelationships:`);
      console.log(`  - Total rows: ${overallStats.relationships.total}`);
      console.log(`  - Successfully created: ${overallStats.relationships.loaded}`);
      console.log(`  - Skipped: ${overallStats.relationships.skipped}`);

      // Determine overall success
      const hasLoadedData = overallStats.nodes.loaded > 0 || overallStats.relationships.loaded > 0;
      const partialSuccess = hasLoadedData && (overallStats.nodes.skipped > 0 || overallStats.relationships.skipped > 0);
      
      if (!hasLoadedData) {
        return { 
          success: false, 
          error: 'No data was successfully loaded into the database',
          statistics: overallStats
        };
      }

      if (partialSuccess) {
        console.log('\n⚠️  Database seeding completed with warnings. Some data was skipped.');
      } else {
        console.log('\n✅ Database seeding completed successfully.');
      }

      return { 
        success: true,
        statistics: overallStats
      };

    } catch (error) {
      console.error('Error during database seeding:', error);
      return { success: false, error: error.message };
    }
  }
}
