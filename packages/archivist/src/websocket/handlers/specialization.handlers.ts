import { Injectable, Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { GellishBaseService } from '../../gellish-base/gellish-base.service';
import {
  SpecializationFactGetRequest,
  SpecializationHierarchyGetRequest,
} from '@relica/websocket-contracts';

@Injectable()
export class SpecializationHandlers {
  private readonly logger = new Logger(SpecializationHandlers.name);

  constructor(private readonly gellishBaseService: GellishBaseService) {}

  async handleSpecializationFactGet(
    data: SpecializationFactGetRequest,
    client: Socket,
  ) {
    this.logger.debug(`Getting specialization fact for UID: ${data.uid}`);
    
    // Call the appropriate service method for specialization fact
    return await this.gellishBaseService.getSpecializationFact(data.uid);
  }

  async handleSpecializationHierarchyGet(
    data: SpecializationHierarchyGetRequest,
    client: Socket,
  ) {
    this.logger.debug(`Getting specialization hierarchy for UID: ${data.uid}`);
    
    // Call the appropriate service method for specialization hierarchy
    return await this.gellishBaseService.getSpecializationHierarchy(data.uid);
  }
}