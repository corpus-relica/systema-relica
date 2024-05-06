import * as XLSX from 'xlsx';
export declare const writeCSV: (ws: XLSX.WorkSheet, outputDir: string, fileName: string, log?: (x: string) => void) => Promise<void>;
