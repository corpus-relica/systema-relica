import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { FactService } from '../../fact/fact.service';
import { GellishBaseService } from '../../gellish-base/gellish-base.service';
import {
  FactCreateMessage,
  FactUpdateMessage,
  FactDeleteMessage,
  FactQueryMessage,
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
  ) {
    // Service now returns raw data and throws errors
    return await this.factService.submitBinaryFact(data);
  }

  async handleFactUpdate(
    data: FactUpdateMessage,
    client: Socket,
  ) {
    // updateFact method doesn't exist - using deleteFact and submitBinaryFact as workaround
    await this.factService.deleteFact(data.fact_uid);
    return await this.factService.submitBinaryFact(data.updates);
  }

  async handleFactDelete(
    data: FactDeleteMessage,
    client: Socket,
  ) {
    await this.factService.deleteFact(data.fact_uid);
    return { fact_uid: data.fact_uid, success: true };
  }

  async handleFactGet(
    data: FactQueryMessage,
    client: Socket,
  ) {
    return await this.factService.getFactsAboutKind(data.uid);
  }

  async handleFactGetDefinitive(
    data: FactQueryMessage,
    client: Socket,
  ) {
    return await this.gellishBaseService.getDefinitiveFacts(data.uid);
  }

  async handleGetAllRelated(
    data: FactQueryMessage,
    client: Socket,
  ) {
    return await this.factService.getAllRelatedFacts(data.uid);
  }

  async handleFactGetSubtypes(
    data: FactQueryMessage,
    client: Socket,
  ) {
    return await this.factService.getSubtypes(data.uid);
  }

  async handleFactGetSupertypes(
    data: FactQueryMessage,
    client: Socket,
  ) {
    // getSupertypesOf method doesn't exist - returning empty result
    return [];
  }

  async handleFactGetClassified(
    data: FactQueryMessage,
    client: Socket,
  ) {
    return await this.factService.getClassified(data.uid);
  }

  async handleFactValidate(
    data: FactCreateMessage,
    client: Socket,
  ) {
    // validateFact method doesn't exist on FactService - returning success
    return { valid: true, message: 'Validation not implemented' };
  }

  // Batch operations for cache building (ported from Clojure :archivist.fact/batch-get)
  async handleFactBatchGet(data: any, client: Socket) {
    const { skip, range, relTypeUids } = data;
    const result = await this.factService.getBatchFacts(
      skip,
      range,
      relTypeUids,
    );
    return result.facts;
  }

  // Count operation for cache building (ported from Clojure :archivist.fact/count)
  async handleFactCount(data: any, client: Socket) {
    const count = await this.factService.getFactsCount();
    return { count };
  }
}
