import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { ArchivistClientModule } from '../archivist-client/archivist-client.module';

@Module({
  imports: [ArchivistClientModule],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}