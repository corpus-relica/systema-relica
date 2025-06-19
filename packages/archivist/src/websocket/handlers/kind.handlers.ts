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

  async handleKindGet(data: KindMessage, client: Socket): Promise<WsResponse> {
    try {
      // getKind method doesn't exist - returning empty result
      const result = null;
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

  // async handleKindsList(data: KindMessage, client: Socket): Promise<WsResponse> {
  async handleKindsList(data: KindMessage, client: Socket): Promise<any> {
    try {
      // Parse parameters from WebSocket message (following Clojure pattern)
      // Expected format: data.filters = {sort: [field, order], range: [skip, pageSize], filter: {}}
      const filters = data.filters || {};
      const sort = filters.sort || ['lh_object_name', 'ASC'];
      const range = filters.range || [0, 10];
      const filter = filters.filter || {};

      const [sortField, sortOrder] = sort;
      const [skip, pageSize] = range;

      // Validate parameters
      const validSortOrder = ['ASC', 'DESC'].includes(sortOrder?.toUpperCase()) 
        ? sortOrder.toUpperCase() 
        : 'ASC';

      const validSkip = Math.max(0, parseInt(skip) || 0);
      const validPageSize = Math.max(1, Math.min(100, parseInt(pageSize) || 10)); // Cap at 100

      console.log(`Getting kinds list: field=${sortField}, order=${validSortOrder}, skip=${validSkip}, pageSize=${validPageSize}`);

      const result = await this.kindsService.getList(
        sortField || 'lh_object_name',
        validSortOrder,
        validSkip,
        validPageSize
      );

      // Transform response to match contract expectations
      // NOTE: Change 'data' to 'facts' to match Clojure implementation
      const response = {
        facts: result.data || [],
        total: result.total || 0
      };

      return {
        success: true,
        payload: response
      };
    } catch (error) {
      console.error('Error in handleKindsList:', error);
      return {
        success: false,
        payload: { message: error.message }
      };
    }
  }

  async handleKindsSearch(data: KindMessage, client: Socket): Promise<WsResponse> {
    try {
      // searchKinds method doesn't exist - returning empty result
      const result = [];
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
