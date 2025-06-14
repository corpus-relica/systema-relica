import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { PrismMessage, ServiceResponse } from '../types/websocket-messages';

@Injectable()
export class PrismWebSocketClientService extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'prism', 3004);
  }

  async getSetupStatus(): Promise<any> {
    const message: PrismMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'prism',
      action: 'get-setup-status',
      payload: {},
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get setup status');
    }
    return response.payload;
  }

  async startSetup(): Promise<any> {
    const message: PrismMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'prism',
      action: 'start-setup',
      payload: {},
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to start setup');
    }
    return response.payload;
  }

  async createUser(userData: { username: string; password: string; confirmPassword: string }): Promise<any> {
    const message: PrismMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'prism',
      action: 'create-user',
      payload: userData,
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create user');
    }
    return response.payload;
  }

  async importData(importData: { dataSource: string; options?: any }): Promise<any> {
    const message: PrismMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'prism',
      action: 'import-data',
      payload: importData,
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to import data');
    }
    return response.payload;
  }

}