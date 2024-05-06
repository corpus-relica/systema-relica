import {promises as fsPromises} from 'node:fs';
// import path from 'path';

export const writeFileAsync = async (
	filename: string,
	data: any,
	log: (x: string) => void = console.log,
) => {
	log('writeFileAsync');
	try {
		await fsPromises.writeFile(filename, data);
		log('File written successfully');
	} catch (error) {
		console.error('Error writing file:', error);
	}
};

export const processFilesInDirectory = async (
	directory: string,
	func: (filename: string) => Promise<void>,
) => {
	try {
		const files = await fsPromises.readdir(directory);
		const csvFiles = files.filter(file => file.endsWith('.csv'));

		for (const file of csvFiles) {
			await func(file);
		}
	} catch (err) {
		console.error('Error processing files:', err);
	}
};
