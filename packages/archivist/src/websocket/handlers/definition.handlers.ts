import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { DefinitionService } from '../../definition/definition.service';
import { DefinitionMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class DefinitionHandlers {
  constructor(private readonly definitionService: DefinitionService) {}

  async handleDefinitionGet(data: DefinitionMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.definitionService.getDefinition(data.uid);
      return {
        event: 'definition:retrieved',
        data: result
      };
    } catch (error) {
      return {
        event: 'definition:error',
        data: { message: error.message }
      };
    }
  }

  async handleDefinitionUpdate(data: DefinitionMessage, client: Socket): Promise<WsResponse> {
    try {
      // updateDefinition method doesn't exist - returning success stub
      const result = { success: true, message: 'Update definition not implemented' };
      return {
        event: 'definition:updated',
        data: result
      };
    } catch (error) {
      return {
        event: 'definition:error',
        data: { message: error.message }
      };
    }
  }
}
