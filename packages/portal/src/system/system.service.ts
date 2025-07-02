import { Injectable, Logger } from '@nestjs/common';
import { PrismWebSocketClientService } from '../shared/services/prism-websocket-client.service';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  
  constructor(private readonly prismClient: PrismWebSocketClientService) {}

  async resetSystem() {
    try {
      return await this.prismClient.resetSystem();
    } catch (error) {
      this.logger.error('Failed to reset system:', error);
      throw error;
    }
  }
}