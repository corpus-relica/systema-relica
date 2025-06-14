import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistWebSocketClientService } from './archivist-websocket-client.service';
import { ClarityWebSocketClientService } from './clarity-websocket-client.service';
import { ApertureWebSocketClientService } from './aperture-websocket-client.service';
import { PrismWebSocketClientService } from './prism-websocket-client.service';
import { NousWebSocketClientService } from './nous-websocket-client.service';
import { ShutterWebSocketClientService } from './shutter-websocket-client.service';

@Module({
  imports: [ConfigModule],
  providers: [
    ArchivistWebSocketClientService,
    ClarityWebSocketClientService,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
    ShutterWebSocketClientService,
  ],
  exports: [
    ArchivistWebSocketClientService,
    ClarityWebSocketClientService,
    ApertureWebSocketClientService,
    PrismWebSocketClientService,
    NousWebSocketClientService,
    ShutterWebSocketClientService,
  ],
})
export class WebSocketClientsModule {}