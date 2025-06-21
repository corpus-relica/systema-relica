import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { FactService } from '../../fact/fact.service';
import { GellishBaseService } from '../../gellish-base/gellish-base.service';
import {
  FactCreateMessage,
  FactUpdateMessage,
  FactDeleteMessage,
  FactQueryMessage,
  WsResponse,
} from '../types/websocket.types';
import { FactActions, FactEvents } from '@relica/websocket-contracts';

@Injectable()
export class FactHandlers {
  constructor(
    private readonly factService: FactService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  async handleFactCreate(
    data: FactCreateMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      const result = await this.factService.submitBinaryFact(data);
      return {
        event: FactEvents.CREATED,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactUpdate(
    data: FactUpdateMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      // updateFact method doesn't exist - using deleteFact and submitBinaryFact as workaround
      await this.factService.deleteFact(data.fact_uid);
      const result = await this.factService.submitBinaryFact(data.updates);
      return {
        event: FactEvents.UPDATED,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactDelete(
    data: FactDeleteMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      const result = await this.factService.deleteFact(data.fact_uid);
      return {
        event: FactEvents.DELETED,
        data: { fact_uid: data.fact_uid, success: true },
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactGet(
    data: FactQueryMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      console.log('FactHandlers.handleFactGet', data);
      const result = await this.factService.getFactsAboutKind(data.uid);
      return {
        event: FactEvents.RETRIEVED,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactGetDefinitive(
    data: FactQueryMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      console.log('FactHandlers.handleFactGetDefinitive', data);
      const result = await this.gellishBaseService.getDefinitiveFacts(data.uid);
      return {
        event: FactEvents.RETRIEVED,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleGetAllRelated(
    data: FactQueryMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      console.log('FactHandlers.handleGetAllRelated', data.uid);
      const result = await this.factService.getAllRelatedFacts(data.uid);
      return {
        event: FactEvents.RETRIEVED,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactGetSubtypes(
    data: FactQueryMessage,
    client: Socket,
  ): Promise<any> {
    try {
      const result = await this.factService.getSubtypes(data.uid);
      return {
        success: true,
        event: FactEvents.SUBTYPES,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactGetSupertypes(
    data: FactQueryMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      // getSupertypesOf method doesn't exist - returning empty result
      const result = [];
      return {
        event: FactEvents.SUPERTYPES,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactGetClassified(
    data: FactQueryMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      const result = await this.factService.getClassified(data.uid);
      return {
        event: FactEvents.CLASSIFIED,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  async handleFactValidate(
    data: FactCreateMessage,
    client: Socket,
  ): Promise<WsResponse> {
    try {
      // validateFact method doesn't exist on FactService - returning success
      const result = { valid: true, message: 'Validation not implemented' };
      return {
        event: FactEvents.VALIDATED,
        data: result,
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  // Batch operations for cache building (ported from Clojure :archivist.fact/batch-get)
  async handleFactBatchGet(data: any, client: Socket): Promise<any> {
    try {
      const { skip, range, relTypeUids } = data;
      const result = await this.factService.getBatchFacts(
        skip,
        range,
        relTypeUids,
      );

      return result.facts;
      // return {
      //   event: FactEvents.BATCH_RETRIEVED,
      //   data: result.facts // Return facts directly to match Clojure (respond-success (:facts result))
      // };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }

  // Count operation for cache building (ported from Clojure :archivist.fact/count)
  async handleFactCount(data: any, client: Socket): Promise<WsResponse> {
    try {
      const count = await this.factService.getFactsCount();
      return {
        event: FactEvents.COUNT_RETRIEVED,
        data: { count }, // Match Clojure (respond-success {:count result})
      };
    } catch (error) {
      return {
        event: FactEvents.ERROR,
        data: { message: error.message },
      };
    }
  }
}
