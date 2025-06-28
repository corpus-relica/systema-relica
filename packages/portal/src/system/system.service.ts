import { Injectable } from '@nestjs/common';
import { PrismWebSocketClientService } from '../shared/services/prism-websocket-client.service';

@Injectable()
export class SystemService {
  constructor(private readonly prismClient: PrismWebSocketClientService) {}

  async resetSystem() {
    return this.prismClient.resetSystem();
  }
}