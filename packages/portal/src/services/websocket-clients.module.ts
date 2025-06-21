import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistSocketClient, ClaritySocketClient, ApertureSocketClient, PrismSocketClient } from '@relica/websocket-clients';
import { ApertureWebSocketClientService } from './aperture-websocket-client.service';
import { PrismWebSocketClientService } from './prism-websocket-client.service';
import { NousWebSocketClientService } from './nous-websocket-client.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ArchivistSocketClient,
    ClaritySocketClient,
    ApertureSocketClient,
    PrismSocketClient,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
  ],
  exports: [
    ArchivistSocketClient,
    ClaritySocketClient,
    ApertureSocketClient,
    PrismSocketClient,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
  ],
})
export class WebSocketClientsModule {}