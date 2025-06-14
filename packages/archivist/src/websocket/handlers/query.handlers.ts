import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { QueryService } from '../../query/query.service';
import { QueryMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class QueryHandlers {
  constructor(private readonly queryService: QueryService) {}

  init(gateway: any) {
    gateway.registerHandler('query:execute', this.handleQueryExecute.bind(this));
    gateway.registerHandler('query:validate', this.handleQueryValidate.bind(this));
    gateway.registerHandler('query:parse', this.handleQueryParse.bind(this));
  }

  async handleQueryExecute(data: QueryMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.queryService.executeQuery(data.query, data.parameters);
      return {
        event: 'query:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'query:error',
        data: { message: error.message }
      };
    }
  }

  async handleQueryValidate(data: QueryMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.queryService.validateQuery(data.query);
      return {
        event: 'query:validated',
        data: result
      };
    } catch (error) {
      return {
        event: 'query:error',
        data: { message: error.message }
      };
    }
  }

  async handleQueryParse(data: QueryMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.queryService.parseQuery(data.query);
      return {
        event: 'query:parsed',
        data: result
      };
    } catch (error) {
      return {
        event: 'query:error',
        data: { message: error.message }
      };
    }
  }
}