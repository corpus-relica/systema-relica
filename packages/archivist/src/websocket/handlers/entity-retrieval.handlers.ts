import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { EntityRetrievalService } from '../../entity-retrieval/entity-retrieval.service';
import { EntityRetrievalMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class EntityRetrievalHandlers {
  constructor(private readonly entityRetrievalService: EntityRetrievalService) {}

  init(gateway: any) {
    gateway.registerHandler('entity:retrieve', this.handleEntityRetrieve.bind(this));
    gateway.registerHandler('entity:getDetails', this.handleEntityGetDetails.bind(this));
  }

  async handleEntityRetrieve(data: EntityRetrievalMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.entityRetrievalService.retrieveEntity(data.uid, data.options);
      return {
        event: 'entity:retrieved',
        data: result
      };
    } catch (error) {
      return {
        event: 'entity:error',
        data: { message: error.message }
      };
    }
  }

  async handleEntityGetDetails(data: EntityRetrievalMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.entityRetrievalService.getEntityDetails(data.uid);
      return {
        event: 'entity:details',
        data: result
      };
    } catch (error) {
      return {
        event: 'entity:error',
        data: { message: error.message }
      };
    }
  }
}