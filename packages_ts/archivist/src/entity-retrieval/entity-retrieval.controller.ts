import { Controller, Get, Query, Post, Body } from '@nestjs/common';

import { GellishBaseService } from 'src/gellish-base/gellish-base.service';
import { EntityRetrievalService } from './entity-retrieval.service.js';

@Controller('retrieveEntity')
export class EntityRetrievalController {
    constructor(
        private readonly entityRetrievalService: EntityRetrievalService,
        private readonly gellishBaseService: GellishBaseService,
    ) {}

    @Get('type')
    async type(@Query('uid') uid: string) {
        const result = await this.entityRetrievalService.getEntityType(
            parseInt(uid),
        );
        return result;
    }

    @Get('category')
    async category(@Query('uid') uid: string) {
        const result = await this.gellishBaseService.getCategory(parseInt(uid));
        return result;
    }

    @Get('collections')
    async collections() {
        const result = await this.entityRetrievalService.getCollections();
        return result;
    }

    // @Get('prompt')
    // async prompt(@Query('uid') uid: string) {
    //     const result = await this.entityRetrievalService.getPrompt(uid + '');
    //     return result;
    // }

    // @Post('prompt')
    // async prompt(@Body('uid') uid: string, @Body('prompt') prompt: string) {
    //     const result = await this.entityRetrievalService.setPrompt(uid, prompt);
    //     return result;
    // }

    // @Get('minFreeEntityUID')
    // async minFreeEntityUID() {
    //     const result = await this.entityRetrievalService.getMinFreeEntityUID();
    //     return result;
    // }

    // @Post('minFreeEntityUID')
    // async minFreeEntityUID(@Body('uid') uid: number) {
    //     const result =
    //         await this.entityRetrievalService.setMinFreeEntityUID(uid);
    //     return result;
    // }

    // @Get('minFreeFactUID')
    // async minFreeFactUID() {
    //     const result = await this.entityRetrievalService.getMinFreeFactUID();
    //     return result;
    // }

    // @Post('minFreeFactUID')
    // async minFreeFactUID(@Body('uid') uid: number) {
    //     const result = await this.entityRetrievalService.setMinFreeFactUID(uid);
    //     return result;
    // }
}
