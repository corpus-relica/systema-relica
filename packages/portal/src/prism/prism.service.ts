import { Injectable } from '@nestjs/common';
import { PrismWebSocketClientService } from '../shared/services/prism-websocket-client.service';

@Injectable()
export class PrismService {
  constructor(private readonly prismClient: PrismWebSocketClientService) {}

  async getSetupStatus() {
    return this.prismClient.getSetupStatus();
  }

  async startSetup() {
    return this.prismClient.startSetup();
  }

  async createUser(userData: { username: string; email: string; password: string }) {
    return this.prismClient.createUser(userData);
  }

  async importData(importData: { dataSource: string; options?: any }) {
    return this.prismClient.importData(importData);
  }

  async resetSystem() {
    return this.prismClient.resetSystem();
  }
}