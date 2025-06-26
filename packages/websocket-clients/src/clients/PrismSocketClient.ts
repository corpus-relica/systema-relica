import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './BaseWebSocketClient';
import {
  PrismActions,
  PrismEvents,
  SetupStatusBroadcastEvent,
} from '@relica/websocket-contracts';

@Injectable()
export class PrismSocketClient extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'prism', 3005);
  }

  protected setupServiceSpecificEventHandlers(): void {
    if (!this.socket) return;
    
    // Forward Prism setup status broadcast events to registered handlers
    this.socket.on(PrismEvents.SETUP_STATUS_UPDATE, (broadcastEvent: SetupStatusBroadcastEvent) => {
      this.emitToHandlers(PrismEvents.SETUP_STATUS_UPDATE, broadcastEvent);
    });
  }

  // =====================================================
  // SETUP OPERATIONS
  // =====================================================

  async getSetupStatus(): Promise<any> {
    const payload = {};
    return this.sendRequestMessage(PrismActions.GET_SETUP_STATUS, payload);
  }

  async startSetup(): Promise<any> {
    const payload = {};
    return this.sendRequestMessage(PrismActions.START_SETUP, payload);
  }

  async createUser(userData: { username: string; email?: string; password: string; confirmPassword?: string }): Promise<any> {
    return this.sendRequestMessage(PrismActions.CREATE_USER, userData);
  }

  async importData(importData: { dataSource: string; options?: any }): Promise<any> {
    return this.sendRequestMessage(PrismActions.IMPORT_DATA, importData);
  }

  async resetSystem(): Promise<any> {
    const payload = {};
    return this.sendRequestMessage(PrismActions.RESET_SYSTEM, payload);
  }

  // Connection utilities inherited from BaseWebSocketClient
}