import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistSocketClient, ClaritySocketClient } from '@relica/websocket-clients';
import { ApertureWebSocketClientService } from './aperture-websocket-client.service';
import { PrismWebSocketClientService } from './prism-websocket-client.service';
import { NousWebSocketClientService } from './nous-websocket-client.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ArchivistSocketClient,
    ClaritySocketClient,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
  ],
  exports: [
    ArchivistSocketClient,
    ClaritySocketClient,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
  ],
})
export class WebSocketClientsModule {}