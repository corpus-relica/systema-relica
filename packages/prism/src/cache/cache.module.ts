import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from './cache.service';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Module({
  imports: [ConfigModule],
  providers: [CacheService, ArchivistSocketClient],
  exports: [CacheService],
})
export class CacheModule {}