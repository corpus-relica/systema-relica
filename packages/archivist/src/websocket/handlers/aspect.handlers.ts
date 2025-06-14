import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { AspectService } from '../../aspect/aspect.service';
import { AspectMessage, WsResponse } from '../types/websocket.types';

@Injectable()
export class AspectHandlers {
  constructor(private readonly aspectService: AspectService) {}

  init(gateway: any) {
    gateway.registerHandler('aspect:get', this.handleAspectGet.bind(this));
    gateway.registerHandler('aspect:operate', this.handleAspectOperate.bind(this));
  }

  async handleAspectGet(data: AspectMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.aspectService.getAspect(data.uid);
      return {
        event: 'aspect:retrieved',
        data: result
      };
    } catch (error) {
      return {
        event: 'aspect:error',
        data: { message: error.message }
      };
    }
  }

  async handleAspectOperate(data: AspectMessage, client: Socket): Promise<WsResponse> {
    try {
      const result = await this.aspectService.performOperation(data.uid, data.operation, data.data);
      return {
        event: 'aspect:operation:result',
        data: result
      };
    } catch (error) {
      return {
        event: 'aspect:error',
        data: { message: error.message }
      };
    }
  }
}