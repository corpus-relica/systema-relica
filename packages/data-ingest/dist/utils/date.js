import * as XLSX from 'xlsx';
export const isRowEmpty = (ws, rowNum, colCount) => {
    for (let colIndex = 0; colIndex < colCount; colIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ c: colIndex, r: rowNum });
        if (ws[cellAddress]) {
            return false; // If any cell is not empty, return false
        }
    }
    return true; // If all cells are empty, return true
};
export const fixDatesInWorksheet = (ws) => {
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
};
