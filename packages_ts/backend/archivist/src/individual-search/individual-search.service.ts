import { Injectable } from '@nestjs/common';
import { ExecuteSearchQueryService } from '../execute-search-query/execute-search-query.service.js';
import {
  textSearchQuery,
  countTextSearchQuery,
  uidSearchQuery,
  countUIDSearchQuery,
} from '../graph/queries.js';

@Injectable()
export class IndividualSearchService {
  constructor(
    private readonly executeSearchQueryService: ExecuteSearchQueryService,
  ) {}

  async getTextSearchIndividual(
    searchTerm,
    collectionUID,
    page = 1,
    pageSize = 10,
  ) {
    const res = await this.executeSearchQueryService.executeSearchQuery(
      textSearchQuery,
      countTextSearchQuery,
      searchTerm,
      [1225],
      [],
      collectionUID,
      page,
      pageSize,
      false, // exactMatch
    );
    return res;
  }

  getUIDSearchIndividual = async (
    searchTerm,
    collectionUID,
    page = 1,
    pageSize = 10,
  ) => {
    const res = await this.executeSearchQueryService.executeSearchQuery(
      uidSearchQuery,
      countUIDSearchQuery,
      searchTerm,
      [1225],
      [],
      collectionUID,
      page,
      pageSize,
      false, // exactMatch
    );
    return res;
  };
}
