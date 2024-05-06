import { writeFileAsync } from '../utils/file.js';
import path from 'path';
import * as XLSX from 'xlsx';
export const writeCSV = async (ws, outputDir, fileName, log = console.log) => {
    await writeFileAsync(path.join(outputDir, fileName), XLSX.utils.sheet_to_csv(ws, { blankrows: false }), log);
};
