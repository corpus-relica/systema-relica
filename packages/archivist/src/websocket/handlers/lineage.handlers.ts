import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LinearizationService } from '../../linearization/linearization.service';
import { WsResponse } from '../types/websocket.types';
import { LineageActions, LineageEvents } from '@relica/websocket-contracts';

@Injectable()
export class LineageHandlers {
  constructor(private readonly linearizationService: LinearizationService) {}

  // Lineage operation for cache building (ported from Clojure :archivist.lineage/get)
  // async handleLineageGet(data: any, client: Socket): Promise<WsResponse> {
  async handleLineageGet(data: any, client: Socket): Promise<any> {
    try {
      const { uid } = data;
      
      if (!uid) {
        // return {
        //   event: LineageEvents.ERROR,
        //   data: { message: 'UID is required' }
        // };
        return { message: 'UID is required' };
      }

      // Use existing LinearizationService.calculateLineage() method
      const lineage = await this.linearizationService.calculateLineage(uid);
      
      return lineage;
      // {
      //   event: LineageEvents.RETRIEVED,
      //   data: { data: lineage } // Match Clojure (respond-success {:data lineage})
      // };
    } catch (error) {
      return {
        event: 'lineage:error',
        data: { message: error.message }
      };
    }
  }
}
