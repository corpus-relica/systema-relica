import { Injectable, Logger } from '@nestjs/common';
import { promises as fsPromises } from 'node:fs';

@Injectable()
export class FileService {
    private readonly logger = new Logger(FileService.name);

    constructor() {}

    async writeFileAsync(filename: string, data: any) {
        this.logger.verbose('writeFileAsync');
        try {
            await fsPromises.writeFile(filename, data);
            this.logger.verbose('File written successfully');
        } catch (error) {
            this.logger.error('Error writing file:', error);
        }
    }

    async processFilesInDirectory(
        directory: string,
        func: (filename: string) => Promise<void>,
    ) {
        try {
            const files = await fsPromises.readdir(directory);
            const csvFiles = files.filter((file) => file.endsWith('.csv'));

            for (const file of csvFiles) {
                await func(file);
            }
        } catch (err) {
            this.logger.error('Error processing files:', err);
        }
    }
}
