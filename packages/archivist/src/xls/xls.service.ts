import { Injectable, Logger } from '@nestjs/common';
import { promises as fsPromises } from 'node:fs';
import * as XLSX from 'xlsx';
import * as path from 'path';

import { CacheService } from 'src/cache/cache.service';
import { FileService } from 'src/file/file.service';

const dataSourceInputXLSDir = path.join(__dirname, '../../seed_xls');
const neo4jImportDir = path.join(__dirname, '../../seed_csv');

@Injectable()
export class XLSService {
  private readonly logger = new Logger(XLSService.name);

  constructor(
    private readonly cacheService: CacheService,
    private readonly fileService: FileService,
  ) {}

  // xlsx

  resolveTempUIDs(
    ws: XLSX.WorkSheet,
    minFreeUID: number = 1000000000,
    minFreeFactUID: number = 2000000000,
  ) {
    //@ts-ignore
    const sheetRange = this.findSheetBounds(ws);
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
      const range = this.findSheetBounds(ws);
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellAddress];

          // only check on certain columns
          if (
            C === lh_object_uid_idx.charCodeAt(0) - 64 ||
            C === rel_type_uid_idx.charCodeAt(0) - 64 ||
            C === rh_object_uid_idx.charCodeAt(0) - 64
          ) {
            if (cell && +cell.v < maxTempUID) {
              cell.v = +cell.v + minFreeUID;
              delete cell.w;
            }
          } else if (C === fact_uid_idx.charCodeAt(0) - 64) {
            if (cell && +cell.v < maxTempUID) {
              cell.v = +cell.v + minFreeFactUID;
              delete cell.w;
            }
          }
        }
      }
    } else {
      // Handle the case where '!ref' is undefined or does not exist
      console.error('Invalid worksheet format: !ref property is missing.');
    }

    return ws;
  }

  findSheetBounds(worksheet: XLSX.WorkSheet): {
    s: { c: number; r: number };
    e: { c: number; r: number };
  } {
    // Finding maxWidth
    let maxWidth = 0;
    while (
      worksheet[XLSX.utils.encode_cell({ c: maxWidth, r: 0 })] ||
      worksheet[XLSX.utils.encode_cell({ c: maxWidth, r: 1 })]
    ) {
      maxWidth++;
    }

    // Finding maxHeight
    let maxHeight = 1;
    let emptyRowCount = 0;
    while (emptyRowCount < 10) {
      const cellRef = 'A' + maxHeight;
      if (!worksheet[cellRef]) {
        emptyRowCount++;
      } else {
        emptyRowCount = 0; // reset if a non-empty row is found
      }
      maxHeight++;
    }
    maxHeight -= 10; // Subtract the 10 empty rows counted last

    return { s: { c: 0, r: 0 }, e: { c: maxWidth, r: maxHeight } };
  }

  async readXLS(filePath: string, log: (x: string) => void = console.log) {
    log('readXLS: ' + filePath);

    const workbook = XLSX.readFile(filePath);
    // const workbook = XLSX.readFile(filePath, {dense: true});
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) throw new Error('No sheet name found.');

    const worksheet: XLSX.WorkSheet | undefined = workbook.Sheets[sheetName];

    if (!worksheet) throw new Error('No worksheet found.');

    // Remove rows 1 and 3
    // Note: XLSX uses 1-based indexing for rows.
    // this was generated from gpt and works in place.
    // that is; it's actually zero-based indexing
    // and once 1 is removed all the indexes shift up by 1.
    // i.e. remove row 1, then remove row 2 (which was row 3) (zero-based)
    const rowsToDelete = [0, 1];
    rowsToDelete.forEach((rowNum) => {
      log('HELLO?');
      const ref = worksheet['!ref'];

      if (!ref) throw new Error('No ref found.');

      const range = this.findSheetBounds(worksheet);

      for (let R = rowNum; R < range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellToMove = XLSX.utils.encode_cell({
            r: R + 1,
            c: C,
          });
          const cellToReplace = XLSX.utils.encode_cell({
            r: R,
            c: C,
          });
          if (worksheet[cellToMove]) {
            worksheet[cellToReplace] = worksheet[cellToMove];
          } else {
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
    if (!yyy) throw new Error('No ref found.');
    const xxx = this.findSheetBounds(worksheet);

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
            const cellToMoveAddress = XLSX.utils.encode_cell({
              r: moveRow,
              c: C,
            });
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

    if (!ref) throw new Error('No ref found.');

    const range = this.findSheetBounds(worksheet);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      const cell = worksheet[cellAddress];
      if (cell) {
        cell.t = 's'; // set cell type to string
        cell.v = String(cell.v); // ensure the value is a string
      }
    }

    log('readXLS: ensured headers are strings');

    const minFreeEntityUID = await this.cacheService.getMinFreeEntityUID();
    const minFreeFactUID = await this.cacheService.getMinFreeFactUID();
    const finalWorksheet = this.resolveTempUIDs(
      worksheet,
      minFreeEntityUID,
      minFreeFactUID,
    );
    log('readXLS: resolved temp uids');
    return finalWorksheet;
  }

  async clearDirectory(directory: string) {
    try {
      const files = await fsPromises.readdir(directory);
      for (const file of files) {
        await fsPromises.unlink(`${directory}/${file}`);
      }
    } catch (err) {
      console.error('Error clearing directory:', err);
      throw err; // Re-throw the error if needed
    }
  }

  async readXLSFixDates(
    files: string[],
    log: (x: string) => void = console.log,
  ) {
    const worksheets: XLSX.WorkSheet[] = [];
    try {
      this.logger.verbose('readXLSFixDates:', files.length);
      for (const file of files) {
        if (!file.endsWith('.xls')) continue; // skip non-xls files
        this.logger.verbose(
          'readXLSFixDates:',
          path.join(dataSourceInputXLSDir, file),
        );
        const ws = await this.readXLS(
          path.join(dataSourceInputXLSDir, file),
          log,
        );
        const fixedWS = this.fixDatesInWorksheet(ws);
        worksheets.push(fixedWS);
      }
    } catch (err) {
      this.logger.error('Error in readXLSFixDates:', err);
    }
    return worksheets;
  }

  async saveCSVFiles(worksheets: XLSX.WorkSheet[]) {
    try {
      this.logger.verbose('WRITE CSV', worksheets.length);
      let idx = 0;
      for (const ws of worksheets) {
        // console.log(ws['!merges']);
        //@ts-ignore
        const csvFilename = idx + '.csv'; //ws['!merges'][0].e.r + '.csv';
        this.logger.verbose('csvFilename: ' + csvFilename);
        await this.writeCSV(ws, neo4jImportDir, csvFilename);
        idx++;
      }

      this.logger.verbose('CSV WRITE COMPLETE');
    } catch (err) {
      console.error('Error in saveCSV:', err);
    }
  }

  async readXLSFixDatesAndSaveCSV(files: string[]) {
    try {
      this.logger.verbose('CLEAR DIRECTORY', neo4jImportDir);
      await this.clearDirectory(neo4jImportDir);

      const worksheets = await this.readXLSFixDates(files);
      await this.saveCSVFiles(worksheets);
    } catch (err) {
      console.error('Error in readXLSFixDatesAndSaveCSV:', err);
    }
  }
  // csv

  async writeCSV(ws: XLSX.WorkSheet, outputDir: string, fileName: string) {
    this.logger.debug(path.join(outputDir, fileName));
    await this.fileService.writeFileAsync(
      path.join(outputDir, fileName),
      XLSX.utils.sheet_to_csv(ws, { blankrows: false }),
    );
  }

  // date

  isRowEmpty(ws: XLSX.WorkSheet, rowNum: number, colCount: number): boolean {
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
      const cellAddress = XLSX.utils.encode_cell({
        c: colIndex,
        r: rowNum,
      });
      if (ws[cellAddress]) {
        return false; // If any cell is not empty, return false
      }
    }
    return true; // If all cells are empty, return true
  }

  fixDatesInWorksheet(ws: XLSX.WorkSheet) {
    //@ts-ignore
    const sheetRange = XLSX.utils.decode_range(ws['!ref']);
    const rowCount = sheetRange.e.r;
    const colCount = sheetRange.e.c;

    //@ts-ignore
    const header = new Array(colCount).fill('x').map((x, idx) => {
      const targ = XLSX.utils.encode_cell({ c: idx, r: 0 });
      const cell = ws[targ];
      return cell ? cell.v : null;
    });

    const idx1 = String.fromCharCode(64 + header.indexOf('9') + 1);
    const idx2 = String.fromCharCode(64 + header.indexOf('10') + 1);

    for (let i = 2; i <= rowCount + 1; i++) {
      // if (isRowEmpty(ws, i - 1, colCount)) continue; // Skip the loop iteration if row is empty

      const targ1 = idx1 + i;
      const targ2 = idx2 + i;
      const cell1 = ws[targ1];
      const cell2 = ws[targ2];
      if (cell1) {
        cell1.t = 'd';
        const date = new Date(cell1.w);
        const dateString = date.toISOString().split('T')[0];
        cell1.v = dateString;
        delete cell1.w;
      }
      if (cell2) {
        cell2.t = 'd';
        const date = new Date(cell2.w);
        const dateString = date.toISOString().split('T')[0];
        cell2.v = dateString;
        delete cell2.w;
      }
    }

    return ws;
  }
}
