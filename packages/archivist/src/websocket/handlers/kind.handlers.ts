import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { KindService } from '../../kind/kind.service';
import { KindsService } from '../../kinds/kinds.service';
import { KindMessage } from '../types/websocket.types';

@Injectable()
export class KindHandlers {
  constructor(
    private readonly kindService: KindService,
    private readonly kindsService: KindsService
  ) {}

  async handleKindGet(data: KindMessage, client: Socket) {
    // getKind method doesn't exist - returning empty result
    return null;
  }

  async handleKindsList(data: KindMessage, client: Socket) {
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
    return {
      facts: result.data || [],
      total: result.total || 0
    };
  }

  async handleKindsSearch(data: KindMessage, client: Socket) {
    // searchKinds method doesn't exist - returning empty result
    return [];
  }
}
