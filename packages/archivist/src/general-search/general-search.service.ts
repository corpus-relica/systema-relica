import {
  textSearchQuery,
  countTextSearchQuery,
  uidSearchQuery,
  countUIDSearchQuery,
} from 'src/graph/queries';
import { Injectable } from '@nestjs/common';
import { ExecuteSearchQueryService } from 'src/execute-search-query/execute-search-query.service';
import { CacheService } from 'src/cache/cache.service';

@Injectable()
export class GeneralSearchService {
  constructor(
    private readonly executeSearchQueryService: ExecuteSearchQueryService,
    private readonly cacheService: CacheService,
  ) {}

  async getTextSearch(
    searchTerm: string,
    collectionUID: number,
    page = 1,
    pageSize = 10,
    filter = null,
    exactMatch = false,
  ) {

    let descendants = [];
    if (filter) {
      descendants = await this.cacheService.allDescendantsOf(
        parseInt(filter.uid),
      );
    }
    
    const res = await this.executeSearchQueryService.executeSearchQuery(
      textSearchQuery,
      countTextSearchQuery,
      searchTerm,
      [1146, 1726, 1981, 1225],
      descendants,
      collectionUID,
      page,
      pageSize,
      exactMatch,
    );

    return res;
  }

  async getUIDSearch(
    searchTerm: number,
    collectionUID: number,
    page = 1,
    pageSize = 10,
    filter = null,
  ) {
    let descendants = [];
    if (filter) {
      descendants = await this.cacheService.allDescendantsOf(
        parseInt(filter.uid),
      );
    }
    const res = await this.executeSearchQueryService.executeSearchQuery(
      uidSearchQuery,
      countUIDSearchQuery,
      searchTerm,
      [1146, 1726, 1981, 1225],
      descendants,
      collectionUID,
      page,
      pageSize,
    );
    return res;
  }
}
