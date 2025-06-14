import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { KindService } from '../../kind/kind.service';
import { KindsService } from '../../kinds/kinds.service';
import { KindMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class KindHandlers {
  constructor(
    private readonly kindService: KindService,
    private readonly kindsService: KindsService
  ) {}

  init(gateway: any) {
    gateway.registerHandler('kind:get', this.handleKindGet.bind(this));
    gateway.registerHandler('kinds:list', this.handleKindsList.bind(this));
    gateway.registerHandler('kinds:search', this.handleKindsSearch.bind(this));
  }

  async handleKindGet(data: KindMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.kindService.getKind(data.uid);
      return {
        event: 'kind:retrieved',
        data: result
      };
    } catch (error) {
      return {
        event: 'kind:error',
        data: { message: error.message }
      };
    }
  }

  async handleKindsList(data: KindMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.kindsService.listKinds(data.filters);
      return {
        event: 'kinds:list',
        data: result
      };
    } catch (error) {
      return {
        event: 'kind:error',
        data: { message: error.message }
      };
    }
  }

  async handleKindsSearch(data: KindMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.kindsService.searchKinds(data.query, data.filters);
      return {
        event: 'kinds:search:results',
        data: result
      };
    } catch (error) {
      return {
        event: 'kind:error',
        data: { message: error.message }
      };
    }
  }
}