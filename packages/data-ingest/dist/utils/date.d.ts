import * as XLSX from 'xlsx';
export declare const isRowEmpty: (ws: XLSX.WorkSheet, rowNum: number, colCount: number) => boolean;
export declare const fixDatesInWorksheet: (ws: XLSX.WorkSheet) => XLSX.WorkSheet;
