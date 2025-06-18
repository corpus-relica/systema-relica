import { Module } from '@nestjs/common';
import { ApertureGateway } from './aperture.gateway';
import { EnvironmentModule } from '../environment/environment.module';
import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';

@Module({
  imports: [EnvironmentModule],
  providers: [ApertureGateway, ArchivistWebSocketClientService],
  exports: [ApertureGateway],
})
export class WebSocketModule {}