import { Injectable, Logger } from '@nestjs/common';
import { PrismWebSocketClientService } from '../shared/services/prism-websocket-client.service';
import { decodePayload } from '@relica/websocket-contracts';

@Injectable()
export class SystemService {
  private readonly logger = new Logger(SystemService.name);
  
  constructor(private readonly prismClient: PrismWebSocketClientService) {}

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