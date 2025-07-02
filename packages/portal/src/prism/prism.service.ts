import { Injectable, Logger } from '@nestjs/common';
import { PrismWebSocketClientService } from '../shared/services/prism-websocket-client.service';

@Injectable()
export class PrismService {
  private readonly logger = new Logger(PrismService.name);
  
  constructor(private readonly prismClient: PrismWebSocketClientService) {}

  async getSetupStatus() {
    try {
      return await this.prismClient.getSetupStatus();
    } catch (error) {
      this.logger.error('Failed to get setup status:', error);
      throw error;
    }
  }

  async startSetup() {
    try {
      return await this.prismClient.startSetup();
    } catch (error) {
      this.logger.error('Failed to start setup:', error);
      throw error;
    }
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    try {
      return await this.prismClient.createUser(userData);
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  async importData(importData: { dataSource: string; options?: any }) {
    try {
      return await this.prismClient.importData(importData);
    } catch (error) {
      this.logger.error('Failed to import data:', error);
      throw error;
    }
  }

  async resetSystem() {
    try {
      return await this.prismClient.resetSystem();
    } catch (error) {
      this.logger.error('Failed to reset system:', error);
      throw error;
    }
  }
}