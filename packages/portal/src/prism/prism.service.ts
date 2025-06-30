import { Injectable, Logger } from '@nestjs/common';
import { PrismWebSocketClientService } from '../shared/services/prism-websocket-client.service';
import { decodePayload } from '@relica/websocket-contracts';

@Injectable()
export class PrismService {
  private readonly logger = new Logger(PrismService.name);
  
  constructor(private readonly prismClient: PrismWebSocketClientService) {}

  async getSetupStatus() {
    try {
      const binaryResponse = await this.prismClient.getSetupStatus();
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error('Failed to get setup status:', error);
      throw error;
    }
  }

  async startSetup() {
    try {
      const binaryResponse = await this.prismClient.startSetup();
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error('Failed to start setup:', error);
      throw error;
    }
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    try {
      const binaryResponse = await this.prismClient.createUser(userData);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async importData(importData: { dataSource: string; options?: any }) {
    try {
      const binaryResponse = await this.prismClient.importData(importData);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error('Failed to import data:', error);
      throw error;
    }
  }

  async resetSystem() {
    try {
      const binaryResponse = await this.prismClient.resetSystem();
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error('Failed to reset system:', error);
      throw error;
    }
  }
}