import { Injectable, Logger } from '@nestjs/common';
import { ApertureSocketClient } from '@relica/websocket-clients';

@Injectable()
export class EnvironmentService {
  private readonly logger = new Logger(EnvironmentService.name);
  
  constructor(private readonly apertureClient: ApertureSocketClient) {}

  async getEnvironment(userId: string) {
    try {
      return await this.apertureClient.getEnvironment(userId);
    } catch (error) {
      this.logger.error(`Failed to get environment for user ${userId}:`, error);
      throw error;
    }
  }
}