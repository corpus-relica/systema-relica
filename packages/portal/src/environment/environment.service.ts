import { Injectable, Logger } from '@nestjs/common';
import { ApertureSocketClient } from '@relica/websocket-clients';
import { decodePayload } from '@relica/websocket-contracts';

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);
  
  constructor(private readonly apertureClient: ApertureSocketClient) {}

  async getEnvironment(userId: string) {
    try {
      const binaryResponse = await this.apertureClient.getEnvironment(userId);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get environment for user ${userId}:`, error);
      throw error;
    }
  }
}