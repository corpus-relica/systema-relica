import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Module({
  imports: [ConfigModule],
  providers: [ArchivistSocketClient],
  exports: [ArchivistSocketClient],
})
export class ServicesModule {}