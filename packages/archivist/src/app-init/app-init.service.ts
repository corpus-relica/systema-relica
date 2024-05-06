import { Logger, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class AppInitService implements OnApplicationBootstrap {
    private readonly logger = new Logger(AppInitService.name);

    constructor(private readonly graphService: GraphService) {}

    async onApplicationBootstrap() {
        await this.initializeDatabase();
        // Perform other application initialization tasks
    }

    private async initializeDatabase() {
        const isEmpty = await this.graphService.isDatabaseEmpty();
        if (isEmpty) {
            //     await this.populateTopINI();
            this.logger.debug('Graph database empty');
        }
    }
}
