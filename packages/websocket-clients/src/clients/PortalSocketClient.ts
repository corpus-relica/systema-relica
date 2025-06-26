import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient, WebSocketServiceClient, ServiceMessage, ServiceResponse } from './BaseWebSocketClient';

@Injectable()
export class PortalSocketClient extends BaseWebSocketClient implements WebSocketServiceClient {
  constructor(
    configService: ConfigService,
    serviceName: string = 'portal',
    defaultPort: number = 2204,
  ) {
    super(configService, serviceName, defaultPort);
  }

  // Portal-specific interface methods
  async sendMessage(message: ServiceMessage): Promise<ServiceResponse> {
    const response = await super.sendRequestMessage(message.action, message.payload);
    return {
      id: message.id || this.generateMessageId(),
      type: 'response',
      success: true,
      data: response,
    };
  }

  onBroadcast(callback: (message: any) => void): void {
    // Implementation will be added by subclasses as needed
  }

  offBroadcast(callback: (message: any) => void): void {
    // Implementation will be added by subclasses as needed
  }
}