import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismSocketClient } from '@relica/websocket-clients';
import { PrismEvents, SetupStatusBroadcastEvent } from '@relica/websocket-contracts';

@Injectable()
export class PrismWebSocketClientService implements OnModuleInit {
  private readonly logger = new Logger(PrismWebSocketClientService.name);
  private portalGateway: any; // Will be injected after initialization to avoid circular dependency

  constructor(private readonly prismClient: PrismSocketClient) {}

  async onModuleInit() {
    // Set up event forwarding from Prism to Portal
    this.prismClient.on(PrismEvents.SETUP_STATUS_UPDATE, (broadcastEvent: SetupStatusBroadcastEvent) => {
      this.logger.log('📡 Received setup status broadcast from Prism, forwarding to frontend clients');
      if (!this.portalGateway) {
        this.logger.warn('PortalGateway not set, cannot forward event');
        return;
      }
      // Forward event directly to frontend clients
      this.portalGateway.server.emit(PrismEvents.SETUP_STATUS_UPDATE, broadcastEvent);
    });
  }

  setPortalGateway(gateway: any) {
    this.portalGateway = gateway;
  }

  // Delegate all methods to the shared PrismSocketClient
  async getSetupStatus(): Promise<any> {
    const result = await this.prismClient.getSetupStatus();
    if (!result.success && result.error) {
      throw new Error(result.error.message || 'Failed to get setup status');
    }
    return result.data || result;
  }

  async startSetup(): Promise<any> {
    const result = await this.prismClient.startSetup();
    if (!result.success && result.error) {
      throw new Error(result.error.message || 'Failed to start setup');
    }
    return result.data || result;
  }

  async createUser(userData: { username: string; email?: string; password: string; confirmPassword?: string }): Promise<any> {
    const result = await this.prismClient.createUser(userData);
    if (!result.success && result.error) {
      throw new Error(result.error.message || 'Failed to create user');
    }
    return result.data || result;
  }

  async importData(importData: { dataSource: string; options?: any }): Promise<any> {
    const result = await this.prismClient.importData(importData);
    if (!result.success && result.error) {
      throw new Error(result.error.message || 'Failed to import data');
    }
    return result.data || result;
  }

  async resetSystem(): Promise<any> {
    const result = await this.prismClient.resetSystem();
    if (!result.success && result.error) {
      throw new Error(result.error.message || 'Failed to reset system');
    }
    return result.data || result;
  }

}
