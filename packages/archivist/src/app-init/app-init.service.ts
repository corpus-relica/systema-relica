import { Logger, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';
import { RawFactIngestionService } from 'src/raw-fact-ingestion/raw-fact-ingestion.service';
import { XLSService } from 'src/xls/xls.service';
import { readdirSync } from 'fs';

@Injectable()
export class AppInitService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AppInitService.name);

    constructor(
        private readonly graphService: GraphService,
        private readonly rawFactIngestionService: RawFactIngestionService,
        private readonly xlsService: XLSService,
    ) {}

    async onApplicationBootstrap() {
        await this.initializeDatabase();
        // Perform other application initialization tasks
    }

    private async initializeDatabase() {
        const isEmpty = await this.graphService.isDatabaseEmpty();
        if (isEmpty) {
            this.logger.debug('Graph database empty');

            //

            // this.logger.log(readdirSync);
            const files = readdirSync('./seed_xls');
            this.logger.log(files);

            this.xlsService.readXLSFixDatesAndSaveCSV(files);

            await this.rawFactIngestionService.loadFromFileCreateNodes('0.csv');

            await this.rawFactIngestionService.loadFromFileCreateRelationships(
                '0.csv',
            );

            // const files = fs.readdirSync('./seed');
            // await this.populateTopINI();
            // await this.buildCaches();
            //
        } else {
            this.logger.debug('Graph database not empty');
        }
    }
}
