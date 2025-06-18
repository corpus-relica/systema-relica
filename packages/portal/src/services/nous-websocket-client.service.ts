import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { ServiceMessage, ServiceResponse } from '../types/websocket-messages';

@Injectable()
export class NousWebSocketClientService extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'nous', 3006);
  }

  async processChatInput(message: string, userId: string, context?: any): Promise<any> {
    const serviceMessage: ServiceMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'nous' as any,
      action: 'process-chat-input',
      payload: { message, userId, context },
    };

    const response = await this.sendMessage(serviceMessage);
    if (!response.success) {
      throw new Error(response.error || 'Failed to process chat input');
    }
    return response.data;
  }

  async generateResponse(prompt: string, context?: any): Promise<any> {
    const serviceMessage: ServiceMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'nous' as any,
      action: 'generate-response',
      payload: { prompt, context },
    };

    const response = await this.sendMessage(serviceMessage);
    if (!response.success) {
      throw new Error(response.error || 'Failed to generate response');
    }
    return response.data;
  }

}