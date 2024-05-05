import { Controller, Get, Query } from '@nestjs/common';
import { KindSearchService } from './kind-search.service';

@Controller('kindSearch')
export class KindSearchController {
    constructor(private readonly kindSearchService: KindSearchService) {}

    @Get('text')
    async text(
        @Query('searchTerm') searchTerm: string,
        @Query('collectionUID') collectionUID: string = '',
        @Query('page') page: string = '1',
        @Query('pageSize') pageSize: string = '50',
    ) {
        const result = await this.kindSearchService.getTextSearchKind(
            searchTerm,
            parseInt(collectionUID),
            parseInt(page),
            parseInt(pageSize),
        );
        return result;
    }

    @Get('uid')
    async uid(
        @Query('searchTerm') searchTerm: string,
        @Query('collectionUID') collectionUID: string = '',
        @Query('page') page: string = '1',
        @Query('pageSize') pageSize: string = '50',
    ) {
        const result = await this.kindSearchService.getUIDSearchKind(
            parseInt(searchTerm, 10),
            parseInt(collectionUID),
            parseInt(page),
            parseInt(pageSize),
        );
        return result;
    }
}
