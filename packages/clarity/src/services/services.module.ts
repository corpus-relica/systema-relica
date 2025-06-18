import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistWebSocketClientService } from './archivist-websocket-client.service';

@Module({
  imports: [ConfigModule],
  providers: [ArchivistWebSocketClientService],
  exports: [ArchivistWebSocketClientService],
})
export class ServicesModule {}