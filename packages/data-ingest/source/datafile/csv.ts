import {writeFileAsync} from '../utils/file.js';
import path from 'path';
import * as XLSX from 'xlsx';

export const writeCSV = async (
	ws: XLSX.WorkSheet,
	outputDir: string,
	fileName: string,
	log: (x: string) => void = console.log,
) => {
	await writeFileAsync(
		path.join(outputDir, fileName),
		XLSX.utils.sheet_to_csv(ws, {blankrows: false}),
		log,
	);
};
