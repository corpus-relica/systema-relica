import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { UIDService } from '../../uid/uid.service';
import { UIDMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class UIDHandlers {
  constructor(private readonly uidService: UIDService) {}

  async handleUIDGenerate(data: UIDMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = this.uidService.reserveUID(1);
      return {
        event: 'uid:generated',
        data: result
      };
    } catch (error) {
      return {
        event: 'uid:error',
        data: { message: error.message }
      };
    }
  }

  async handleUIDBatch(data: UIDMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = this.uidService.reserveUID(data.count || 1);
      return {
        event: 'uid:batch:generated',
        data: result
      };
    } catch (error) {
      return {
        event: 'uid:error',
        data: { message: error.message }
      };
    }
  }

  async handleUIDReserve(data: UIDMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = this.uidService.reserveUID(data.count || 1);
      return {
        event: 'uid:range:reserved',
        data: result
      };
    } catch (error) {
      return {
        event: 'uid:error',
        data: { message: error.message }
      };
    }
  }
}
