import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { PrismMessage, ServiceResponse } from '../types/websocket-messages';
import { PrismActions, PrismEvents, SetupStatusBroadcastEvent } from '@relica/websocket-contracts';

@Injectable()
export class PrismWebSocketClientService extends BaseWebSocketClient {
  private portalGateway: any; // Will be injected after initialization to avoid circular dependency

  constructor(configService: ConfigService) {
    super(configService, 'prism', 3004);
  }

  setPortalGateway(gateway: any) {
    this.portalGateway = gateway;
    this.setupBroadcastListener();
  }

  private setupBroadcastListener() {
    if (!this.socket || !this.portalGateway) return;

    // Listen for setup status broadcasts from Prism
    this.socket.on(PrismEvents.SETUP_STATUS_UPDATE, (broadcastEvent: SetupStatusBroadcastEvent) => {
      this.logger.log('📡 Received setup status broadcast from Prism, forwarding to frontend clients');
      
      // Forward the broadcast to all connected frontend clients via Portal Gateway
      this.portalGateway.server.emit(PrismEvents.SETUP_STATUS_UPDATE, broadcastEvent);
    });
  }

  // Override connect to set up listener after connection
  async connect(): Promise<void> {
    await super.connect();
    this.setupBroadcastListener();
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
    return response.data;
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
    return response.data;
  }

  async createUser(userData: { username: string; email: string; password: string }): Promise<any> {
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
    return response.data;
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
    return response.data;
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
    return response.data;
  }

}
