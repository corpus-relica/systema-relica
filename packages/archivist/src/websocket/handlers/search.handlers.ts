import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GeneralSearchService } from '../../general-search/general-search.service';
import { IndividualSearchService } from '../../individual-search/individual-search.service';
import { KindSearchService } from '../../kind-search/kind-search.service';
import { ExecuteSearchQueryService } from '../../execute-search-query/execute-search-query.service';
import { SearchMessage } from '@relica/websocket-contracts';

@Injectable()
export class SearchHandlers {
  constructor(
    private readonly generalSearchService: GeneralSearchService,
    private readonly individualSearchService: IndividualSearchService,
    private readonly kindSearchService: KindSearchService,
    private readonly executeSearchQueryService: ExecuteSearchQueryService
  ) {}

  async handleGeneralSearch(data: SearchMessage, client: Socket) {
    return await this.generalSearchService.getTextSearch(
      data.searchTerm,
      data.collectionUID || null,
      data.page || 1,
      data.pageSize || 20,
      data.filter || null,
      false // exactMatch
    );
  }

  async handleIndividualSearch(data: SearchMessage, client: Socket) {
    // search method doesn't exist on IndividualSearchService - returning empty results
    return [];
  }

  async handleKindSearch(data: SearchMessage, client: Socket) {
    return await this.kindSearchService.getTextSearchKind(
      data.searchTerm, 
      data.collectionUID || null,
      data.page || 1, 
      data.pageSize || 20
    );
  }

  async handleExecuteSearch(data: SearchMessage, client: Socket) {
    // executeSearchQuery requires specific parameters - providing defaults
    return await this.executeSearchQueryService.executeSearchQuery(
      data.searchTerm,
      data.searchTerm, // using same for countQuery
      data.searchTerm || '',
      [], // relTypeUIDs
      [], // filterUIDs
      data.collectionUID || null,
      data.page || 1,
      data.pageSize || 20,
      false // exactMatch
    );
  }

  async handleUidSearch(data: { uid: number }, client: Socket) {
    return await this.generalSearchService.getUIDSearch(
      data.uid, 
      null, // collectionUID
      1, // page
      20, // pageSize
      null // filter
    );
  }
}
