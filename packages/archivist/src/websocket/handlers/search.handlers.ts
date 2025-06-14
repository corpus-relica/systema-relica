import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GeneralSearchService } from '../../general-search/general-search.service';
import { IndividualSearchService } from '../../individual-search/individual-search.service';
import { KindSearchService } from '../../kind-search/kind-search.service';
import { ExecuteSearchQueryService } from '../../execute-search-query/execute-search-query.service';
import { SearchMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class SearchHandlers {
  constructor(
    private readonly generalSearchService: GeneralSearchService,
    private readonly individualSearchService: IndividualSearchService,
    private readonly kindSearchService: KindSearchService,
    private readonly executeSearchQueryService: ExecuteSearchQueryService
  ) {}

  init(gateway: any) {
    gateway.registerHandler('search:general', this.handleGeneralSearch.bind(this));
    gateway.registerHandler('search:individual', this.handleIndividualSearch.bind(this));
    gateway.registerHandler('search:kind', this.handleKindSearch.bind(this));
    gateway.registerHandler('search:execute', this.handleExecuteSearch.bind(this));
    gateway.registerHandler('search:uid', this.handleUidSearch.bind(this));
  }

  async handleGeneralSearch(data: SearchMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.generalSearchService.getTextSearch(
        data.query, 
        null, // collectionUID
        data.page || 1, 
        data.limit || 20,
        null, // filter
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
        data.query, 
        null, // collectionUID
        data.page || 1, 
        data.limit || 20
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
        data.query,
        data.query, // using same for countQuery
        data.query || '',
        [], // relTypeUIDs
        [], // filterUIDs
        null, // collectionUID
        data.page || 1,
        data.limit || 20,
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