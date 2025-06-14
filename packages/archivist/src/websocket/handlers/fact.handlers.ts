import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { FactService } from '../../fact/fact.service';
import { 
  FactCreateMessage, 
  FactUpdateMessage, 
  FactDeleteMessage, 
  FactQueryMessage,
  WsResponse 
} from '../types/websocket.types';

@Injectable()
export class FactHandlers {
  constructor(private readonly factService: FactService) {}

  init(gateway: any) {
    gateway.registerHandler('fact:create', this.handleFactCreate.bind(this));
    gateway.registerHandler('fact:update', this.handleFactUpdate.bind(this));
    gateway.registerHandler('fact:delete', this.handleFactDelete.bind(this));
    gateway.registerHandler('fact:get', this.handleFactGet.bind(this));
    gateway.registerHandler('fact:getSubtypes', this.handleFactGetSubtypes.bind(this));
    gateway.registerHandler('fact:getSupertypes', this.handleFactGetSupertypes.bind(this));
    gateway.registerHandler('fact:getClassified', this.handleFactGetClassified.bind(this));
    gateway.registerHandler('fact:validate', this.handleFactValidate.bind(this));
  }

  async handleFactCreate(data: FactCreateMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.submitBinaryFact(data);
      return {
        event: 'fact:created',
        data: result
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }

  async handleFactUpdate(data: FactUpdateMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.updateFact(data.fact_uid, data.updates);
      return {
        event: 'fact:updated',
        data: result
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }

  async handleFactDelete(data: FactDeleteMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.deleteFact(data.fact_uid);
      return {
        event: 'fact:deleted',
        data: { fact_uid: data.fact_uid, success: true }
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }

  async handleFactGet(data: FactQueryMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.getFactsAboutKind(data.uid);
      return {
        event: 'fact:retrieved',
        data: result
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }

  async handleFactGetSubtypes(data: FactQueryMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.getSubtypesOf(
        data.uid, 
        data.includeSubtypes ?? true
      );
      return {
        event: 'fact:subtypes',
        data: result
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }

  async handleFactGetSupertypes(data: FactQueryMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.getSupertypesOf(
        data.uid, 
        data.includeSubtypes ?? true
      );
      return {
        event: 'fact:supertypes',
        data: result
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }

  async handleFactGetClassified(data: FactQueryMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.getClassifiedEntitiesOf(data.uid);
      return {
        event: 'fact:classified',
        data: result
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }

  async handleFactValidate(data: FactCreateMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.factService.validateFact(data);
      return {
        event: 'fact:validated',
        data: result
      };
    } catch (error) {
      return {
        event: 'fact:error',
        data: { message: error.message }
      };
    }
  }
}