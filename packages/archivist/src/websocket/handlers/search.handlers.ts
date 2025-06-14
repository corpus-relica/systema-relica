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
      const result = await this.generalSearchService.search(
        data.query, 
        data.page || 1, 
        data.limit || 20
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
      const result = await this.individualSearchService.search(
        data.query, 
        data.page || 1, 
        data.limit || 20
      );
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
      const result = await this.kindSearchService.search(
        data.query, 
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
      const result = await this.executeSearchQueryService.executeQuery(data.query);
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
      const result = await this.generalSearchService.searchByUID(data.uid);
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