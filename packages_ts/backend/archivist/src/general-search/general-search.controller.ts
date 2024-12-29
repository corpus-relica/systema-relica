import { Controller, Get, Query } from '@nestjs/common';
import { GeneralSearchService } from './general-search.service.js';

@Controller('generalSearch')
export class GeneralSearchController {
  constructor(private readonly generalSearchService: GeneralSearchService) {}

  @Get('text')
  async text(
    @Query('searchTerm') searchTerm: string,
    @Query('collectionUID') collectionUID: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('filter') filter: string,
    @Query('exactMatch') exactMatch: boolean,
  ) {
    return this.generalSearchService.getTextSearch(
      searchTerm,
      parseInt(collectionUID),
      parseInt(page),
      parseInt(pageSize),
      filter,
      exactMatch,
    );
  }

  @Get('uid')
  async uid(
    @Query('searchTerm') searchTerm: string,
    @Query('collectionUID') collectionUID: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('filter') filter: string,
  ) {
    return this.generalSearchService.getUIDSearch(
      parseInt(searchTerm),
      parseInt(collectionUID),
      parseInt(page),
      parseInt(pageSize),
      filter,
    );
  }
}
