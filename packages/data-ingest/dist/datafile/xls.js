import { promises as fsPromises } from 'node:fs';
import * as XLSX from 'xlsx';
import path from 'path';
import { writeCSV } from './csv.js';
import { fixDatesInWorksheet } from '../utils/date.js';
import { getMinFreeEntityUID, getMinFreeFactUID } from '../data/redis.js';
import { neo4jImportDir } from '../constants.js';
const dataSourceInputXLSDir = './seed';
// interface WorksheetRange {
// 	s: {c: number; r: number}; // Start cell
// 	e: {c: number; r: number}; // End cell
// }
const resolveTempUIDs = (ws, minFreeUID = 1000000000, minFreeFactUID = 2000000000) => {
    //@ts-ignore
    const sheetRange = findSheetBounds(ws);
    const colCount = sheetRange.e.c;
    //@ts-ignore
    const header = new Array(colCount).fill('x').map((x, idx) => {
        const targ = XLSX.utils.encode_cell({ c: idx, r: 0 });
        const cell = ws[targ];
        return cell ? cell.v : null;
    });
    const lh_object_uid_idx = String.fromCharCode(64 + header.indexOf('2'));
    const rel_type_uid_idx = String.fromCharCode(64 + header.indexOf('60'));
    const rh_object_uid_idx = String.fromCharCode(64 + header.indexOf('15'));
    const fact_uid_idx = String.fromCharCode(64 + header.indexOf('1'));
    const maxTempUID = 1000;
    if (ws['!ref']) {
        const range = findSheetBounds(ws);
        for (let R = 1; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = ws[cellAddress];
                // only check on certain columns
                if (C === lh_object_uid_idx.charCodeAt(0) - 64 ||
                    C === rel_type_uid_idx.charCodeAt(0) - 64 ||
                    C === rh_object_uid_idx.charCodeAt(0) - 64) {
                    if (cell && +cell.v < maxTempUID) {
                        cell.v = +cell.v + minFreeUID;
                        delete cell.w;
                    }
                }
                else if (C === fact_uid_idx.charCodeAt(0) - 64) {
                    if (cell && +cell.v < maxTempUID) {
                        cell.v = +cell.v + minFreeFactUID;
                        delete cell.w;
                    }
                }
            }
        }
    }
    else {
        // Handle the case where '!ref' is undefined or does not exist
        console.error('Invalid worksheet format: !ref property is missing.');
    }
    return ws;
};
export function findSheetBounds(worksheet) {
    // Finding maxWidth
    let maxWidth = 0;
    while (worksheet[XLSX.utils.encode_cell({ c: maxWidth, r: 0 })] ||
        worksheet[XLSX.utils.encode_cell({ c: maxWidth, r: 1 })]) {
        maxWidth++;
    }
    // Finding maxHeight
    let maxHeight = 1;
    let emptyRowCount = 0;
    while (emptyRowCount < 10) {
        const cellRef = 'A' + maxHeight;
        if (!worksheet[cellRef]) {
            emptyRowCount++;
        }
        else {
            emptyRowCount = 0; // reset if a non-empty row is found
        }
        maxHeight++;
    }
    maxHeight -= 10; // Subtract the 10 empty rows counted last
    return { s: { c: 0, r: 0 }, e: { c: maxWidth, r: maxHeight } };
}
export const readXLS = async (filePath, log = console.log) => {
    log('readXLS: ' + filePath);
    const workbook = XLSX.readFile(filePath);
    // const workbook = XLSX.readFile(filePath, {dense: true});
    const sheetName = workbook.SheetNames[0];
    if (!sheetName)
        throw new Error('No sheet name found.');
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet)
        throw new Error('No worksheet found.');
    // Remove rows 1 and 3
    // Note: XLSX uses 1-based indexing for rows.
    // this was generated from gpt and works in place.
    // that is; it's actually zero-based indexing
    // and once 1 is removed all the indexes shift up by 1.
    // i.e. remove row 1, then remove row 2 (which was row 3) (zero-based)
    const rowsToDelete = [0, 1];
    rowsToDelete.forEach(rowNum => {
        log('HELLO?');
        const ref = worksheet['!ref'];
        if (!ref)
            throw new Error('No ref found.');
        const range = findSheetBounds(worksheet);
        for (let R = rowNum; R < range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellToMove = XLSX.utils.encode_cell({ r: R + 1, c: C });
                const cellToReplace = XLSX.utils.encode_cell({ r: R, c: C });
                if (worksheet[cellToMove]) {
                    worksheet[cellToReplace] = worksheet[cellToMove];
                }
                else {
                    delete worksheet[cellToReplace];
                }
            }
        }
        range.e.r--;
        worksheet['!ref'] = XLSX.utils.encode_range(range.s, range.e);
    });
    log('readXLS: removed header rows');
    // Remove empty rows
    // Note: XLSX uses 1-based indexing for rows.
    const yyy = worksheet['!ref'];
    if (!yyy)
        throw new Error('No ref found.');
    const xxx = findSheetBounds(worksheet);
    for (let R = 0; R <= xxx.e.r; ++R) {
        let rowIsEmpty = true;
        for (let C = xxx.s.c; C <= xxx.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            const cell = worksheet[cellAddress];
            if (cell && cell.v) {
                rowIsEmpty = false;
                break;
            }
        }
        if (rowIsEmpty) {
            // Shift all rows up
            for (let moveRow = R + 1; moveRow <= xxx.e.r; ++moveRow) {
                for (let C = xxx.s.c; C <= xxx.e.c; ++C) {
                    const cellToMoveAddress = XLSX.utils.encode_cell({ r: moveRow, c: C });
                    const cellToReplaceAddress = XLSX.utils.encode_cell({
                        r: moveRow - 1,
                        c: C,
                    });
                    worksheet[cellToReplaceAddress] = worksheet[cellToMoveAddress];
                }
            }
            // Update the range of the worksheet
            xxx.e.r--;
            worksheet['!ref'] = XLSX.utils.encode_range(xxx.s, xxx.e);
            R--; // Decrement R to check the new row at this index
        }
    }
    log('readXLS: removed wmpty rows');
    // Ensure headers are strings
    const ref = worksheet['!ref'];
    if (!ref)
        throw new Error('No ref found.');
    const range = findSheetBounds(worksheet);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        const cell = worksheet[cellAddress];
        if (cell) {
            cell.t = 's'; // set cell type to string
            cell.v = String(cell.v); // ensure the value is a string
        }
    }
    log('readXLS: ensured headers are strings');
    const minFreeEntityUID = await getMinFreeEntityUID();
    const minFreeFactUID = await getMinFreeFactUID();
    const finalWorksheet = resolveTempUIDs(worksheet, minFreeEntityUID, minFreeFactUID);
    log('readXLS: resolved temp uids');
    return finalWorksheet;
};
const clearDirectory = async (directory) => {
    try {
        const files = await fsPromises.readdir(directory);
        for (const file of files) {
            await fsPromises.unlink(`${directory}/${file}`);
        }
    }
    catch (err) {
        console.error('Error clearing directory:', err);
        throw err; // Re-throw the error if needed
    }
};
export const readXLSFixDates = async (files, log = console.log) => {
    const worksheets = [];
    try {
        for (const file of files) {
            if (!file.endsWith('.xls'))
                continue; // skip non-xls files
            const ws = await readXLS(path.join(dataSourceInputXLSDir, file), log);
            const fixedWS = fixDatesInWorksheet(ws);
            worksheets.push(fixedWS);
        }
    }
    catch (err) {
        console.error('Error in readXLSFixDates:', err);
    }
    return worksheets;
};
export const saveCSVFiles = async (worksheets, log = console.log) => {
    try {
        log('WRITE CSV');
        let idx = 0;
        for (const ws of worksheets) {
            // console.log(ws['!merges']);
            //@ts-ignore
            const csvFilename = idx + '.csv'; //ws['!merges'][0].e.r + '.csv';
            log('csvFilename: ' + csvFilename);
            await writeCSV(ws, neo4jImportDir, csvFilename, log);
        }
        log('CSV WRITE COMPLETE');
    }
    catch (err) {
        console.error('Error in saveCSV:', err);
    }
};
export const readXLSFixDatesAndSaveCSV = async (files, log = console.log) => {
    try {
        log('CLEAR DIRECTORY');
        await clearDirectory(neo4jImportDir);
        const worksheets = await readXLSFixDates(files, log);
        await saveCSVFiles(worksheets, log);
    }
    catch (err) {
        console.error('Error in readXLSFixDatesAndSaveCSV:', err);
    }
};
