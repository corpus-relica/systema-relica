import * as XLSX from 'xlsx';
export declare function findSheetBounds(worksheet: XLSX.WorkSheet): {
    s: {
        c: number;
        r: number;
    };
    e: {
        c: number;
        r: number;
    };
};
export declare const readXLS: (filePath: string, log?: (x: string) => void) => Promise<XLSX.WorkSheet>;
export declare const readXLSFixDates: (files: string[], log?: (x: string) => void) => Promise<XLSX.WorkSheet[]>;
export declare const saveCSVFiles: (worksheets: XLSX.WorkSheet[], log?: (x: string) => void) => Promise<void>;
export declare const readXLSFixDatesAndSaveCSV: (files: string[], log?: (x: string) => void) => Promise<void>;
