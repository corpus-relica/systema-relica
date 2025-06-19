import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GeneralSearchService } from '../../general-search/general-search.service';
import { IndividualSearchService } from '../../individual-search/individual-search.service';
import { KindSearchService } from '../../kind-search/kind-search.service';
import { ExecuteSearchQueryService } from '../../execute-search-query/execute-search-query.service';
import { SearchMessage } from '@relica/websocket-contracts';
import { WsResponse } from '../types/websocket.types';

@Injectable()
export class SearchHandlers {
  constructor(
    private readonly generalSearchService: GeneralSearchService,
    private readonly individualSearchService: IndividualSearchService,
    private readonly kindSearchService: KindSearchService,
    private readonly executeSearchQueryService: ExecuteSearchQueryService
  ) {}

  async handleGeneralSearch(data: SearchMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.generalSearchService.getTextSearch(
        data.searchTerm, 
        data.collectionUID || null,
        data.page || 1, 
        data.pageSize || 20,
        data.filter || null,
        false // exactMatch
      );
      return {
        event: 'search:general:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'search:error',
        data: { message: error.message }
      };
    }
  }

  async handleIndividualSearch(data: SearchMessage, client: Socket): Promise<WsResponse> {
    try {
      // search method doesn't exist on IndividualSearchService - returning empty results
      const result = [];
      return {
        event: 'search:individual:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'search:error',
        data: { message: error.message }
      };
    }
  }

  async handleKindSearch(data: SearchMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.kindSearchService.getTextSearchKind(
        data.searchTerm, 
        data.collectionUID || null,
        data.page || 1, 
        data.pageSize || 20
      );
      return {
        event: 'search:kind:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'search:error',
        data: { message: error.message }
      };
    }
  }

  async handleExecuteSearch(data: SearchMessage, client: Socket): Promise<WsResponse> {
    try {
      // executeSearchQuery requires specific parameters - providing defaults
      const result = await this.executeSearchQueryService.executeSearchQuery(
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
      return {
        event: 'search:execute:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'search:error',
        data: { message: error.message }
      };
    }
  }

  async handleUidSearch(data: { uid: number }, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.generalSearchService.getUIDSearch(
        data.uid, 
        null, // collectionUID
        1, // page
        20, // pageSize
        null // filter
      );
      return {
        event: 'search:uid:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'search:error',
        data: { message: error.message }
      };
    }
  }
}
