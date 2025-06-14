import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { ConceptService } from '../../concept/concept.service';
import { ConceptMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class ConceptHandlers {
  constructor(private readonly conceptService: ConceptService) {}

  init(gateway: any) {
    gateway.registerHandler('concept:get', this.handleConceptGet.bind(this));
    gateway.registerHandler('concept:create', this.handleConceptCreate.bind(this));
    gateway.registerHandler('concept:update', this.handleConceptUpdate.bind(this));
    gateway.registerHandler('concept:delete', this.handleConceptDelete.bind(this));
  }

  async handleConceptGet(data: ConceptMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.conceptService.getConcept(data.uid);
      return {
        event: 'concept:retrieved',
        data: result
      };
    } catch (error) {
      return {
        event: 'concept:error',
        data: { message: error.message }
      };
    }
  }

  async handleConceptCreate(data: ConceptMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.conceptService.createConcept(data.data);
      return {
        event: 'concept:created',
        data: result
      };
    } catch (error) {
      return {
        event: 'concept:error',
        data: { message: error.message }
      };
    }
  }

  async handleConceptUpdate(data: ConceptMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.conceptService.updateConcept(data.uid, data.data);
      return {
        event: 'concept:updated',
        data: result
      };
    } catch (error) {
      return {
        event: 'concept:error',
        data: { message: error.message }
      };
    }
  }

  async handleConceptDelete(data: ConceptMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.conceptService.deleteConcept(data.uid);
      return {
        event: 'concept:deleted',
        data: { uid: data.uid, success: true }
      };
    } catch (error) {
      return {
        event: 'concept:error',
        data: { message: error.message }
      };
    }
  }
}