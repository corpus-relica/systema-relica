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
  ): Promise<any> {
    try {
      this.logger.debug(`Getting specialization fact for UID: ${data.uid}`);
      
      // Call the appropriate service method for specialization fact
      const facts = await this.gellishBaseService.getSpecializationFact(data.uid);
      
      return {
        success: true,
        facts: facts || [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get specialization fact for UID ${data.uid}:`,
        error,
      );
      return {
        success: false,
        error: {
          code: 'specialization-fact-get-failed',
          type: 'database-error',
          message: error.message || 'Failed to get specialization fact',
        },
      };
    }
  }

  async handleSpecializationHierarchyGet(
    data: SpecializationHierarchyGetRequest,
    client: Socket,
  ): Promise<any> {
    try {
      this.logger.debug(`Getting specialization hierarchy for UID: ${data.uid}`);
      
      // Call the appropriate service method for specialization hierarchy
      const hierarchy = await this.gellishBaseService.getSpecializationHierarchy(data.uid);
      
      return {
        success: true,
        facts: hierarchy?.facts || [],
        concepts: hierarchy?.concepts || [],
      };
    } catch (error) {
      this.logger.error(
        `Failed to get specialization hierarchy for UID ${data.uid}:`,
        error,
      );
      return {
        success: false,
        error: {
          code: 'specialization-hierarchy-get-failed',
          type: 'database-error',
          message: error.message || 'Failed to get specialization hierarchy',
        },
      };
    }
  }
}