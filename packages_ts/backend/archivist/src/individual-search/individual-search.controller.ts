import { Controller, Get, Query } from '@nestjs/common';
import { IndividualSearchService } from './individual-search.service.js';

@Controller('individualSearch')
export class IndividualSearchController {
  constructor(
    private readonly individualSearchService: IndividualSearchService,
  ) {}

  @Get('text')
  async text(
    @Query('searchTerm') searchTerm: string,
    @Query('collectionUID') collectionUID: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const result = await this.individualSearchService.getTextSearchIndividual(
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
    @Query('collectionUID') collectionUID: string,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '50',
  ) {
    const result = await this.individualSearchService.getUIDSearchIndividual(
      parseInt(searchTerm),
      parseInt(collectionUID),
      parseInt(page),
      parseInt(pageSize),
    );
    return result;
  }
}
