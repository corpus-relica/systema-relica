import { Injectable } from '@nestjs/common';
import { ApertureSocketClient } from '@relica/websocket-clients';

@Injectable()
export class EnvironmentService {
  constructor(private readonly apertureClient: ApertureSocketClient) {}

  async getEnvironment(userId: string) {
    return this.apertureClient.getEnvironment(userId);
  }
}