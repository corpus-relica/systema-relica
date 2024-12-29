import {
  textSearchQuery,
  countTextSearchQuery,
  uidSearchQuery,
  countUIDSearchQuery,
} from '../graph/queries.js';
import { Injectable } from '@nestjs/common';
import { ExecuteSearchQueryService } from '../execute-search-query/execute-search-query.service.js';
import { CacheService } from '../cache/cache.service.js';

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
    console.log('TEXT SEARCH: ', res);
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
