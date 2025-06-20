import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistSocketClient } from '@relica/websocket-clients';
import { ClarityWebSocketClientService } from './clarity-websocket-client.service';
import { ApertureWebSocketClientService } from './aperture-websocket-client.service';
import { PrismWebSocketClientService } from './prism-websocket-client.service';
import { NousWebSocketClientService } from './nous-websocket-client.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ArchivistSocketClient,
    ClarityWebSocketClientService,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
  ],
  exports: [
    ArchivistSocketClient,
    ClarityWebSocketClientService,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
  ],
})
export class WebSocketClientsModule {}