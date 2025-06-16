import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { PrismMessage, ServiceResponse } from '../types/websocket-messages';
import { PrismActions } from '@relica/websocket-contracts';

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
      action: PrismActions.GET_SETUP_STATUS,
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
      action: PrismActions.START_SETUP,
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
      action: PrismActions.CREATE_USER,
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
      action: PrismActions.IMPORT_DATA,
      payload: importData,
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to import data');
    }
    return response.payload;
  }

  async resetSystem(): Promise<any> {
    const message: PrismMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'prism',
      action: PrismActions.RESET_SYSTEM,
      payload: {},
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to reset system');
    }
    return response.payload;
  }

}