import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LinearizationService } from '../../linearization/linearization.service';
import { WsResponse } from '../types/websocket.types';

@Injectable()
export class LineageHandlers {
  constructor(private readonly linearizationService: LinearizationService) {}

  init(gateway: any) {
    gateway.registerHandler('lineage:get', this.handleLineageGet.bind(this));
  }

  // Lineage operation for cache building (ported from Clojure :archivist.lineage/get)
  async handleLineageGet(data: any, client: Socket): Promise<WsResponse> {
    try {
      const { uid } = data;
      
      if (!uid) {
        return {
          event: 'lineage:error',
          data: { message: 'UID is required' }
        };
      }

      // Use existing LinearizationService.calculateLineage() method
      const lineage = await this.linearizationService.calculateLineage(uid);
      
      return {
        event: 'lineage:retrieved',
        data: { data: lineage } // Match Clojure (respond-success {:data lineage})
      };
    } catch (error) {
      return {
        event: 'lineage:error',
        data: { message: error.message }
      };
    }
  }
}