import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { ServiceMessage, ServiceResponse } from '../types/websocket-messages';

@Injectable()
export class ShutterWebSocketClientService extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'shutter', 3004);
  }

  async validateJWT(jwt: string): Promise<any> {
    const serviceMessage: ServiceMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'shutter',
      action: 'validate-jwt',
      payload: { jwt },
    };

    const response = await this.sendMessage(serviceMessage);
    if (!response.success) {
      throw new Error(response.error || 'Failed to validate JWT');
    }
    return response.payload;
  }

  async authenticate(credentials: { username: string; password: string }): Promise<any> {
    const serviceMessage: ServiceMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'shutter',
      action: 'authenticate',
      payload: credentials,
    };

    const response = await this.sendMessage(serviceMessage);
    if (!response.success) {
      throw new Error(response.error || 'Authentication failed');
    }
    return response.payload;
  }

  async refreshToken(refreshToken: string): Promise<any> {
    const serviceMessage: ServiceMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'shutter',
      action: 'refresh-token',
      payload: { refreshToken },
    };

    const response = await this.sendMessage(serviceMessage);
    if (!response.success) {
      throw new Error(response.error || 'Failed to refresh token');
    }
    return response.payload;
  }

}