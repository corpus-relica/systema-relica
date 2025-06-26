import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistService } from './archivist.service';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Module({
  imports: [ConfigModule],
  providers: [ArchivistSocketClient, ArchivistService],
  controllers: [],
  exports: [ArchivistService],
})
export class ArchivistModule {}
