import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { LinearizationService } from '../../linearization/linearization.service';
import { LineageActions, LineageEvents } from '@relica/websocket-contracts';

@Injectable()
export class LineageHandlers {
  constructor(private readonly linearizationService: LinearizationService) {}

  // Lineage operation for cache building (ported from Clojure :archivist.lineage/get)
  async handleLineageGet(data: any, client: Socket) {
    const { uid } = data;
    
    if (!uid) {
      throw new Error('UID is required');
    }

    // Use existing LinearizationService.calculateLineage() method
    return await this.linearizationService.calculateLineage(uid);
  }
}
