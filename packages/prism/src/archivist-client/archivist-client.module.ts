import { Module } from '@nestjs/common';
import { ArchivistClientService } from './archivist-client.service';

@Module({
  providers: [ArchivistClientService],
  exports: [ArchivistClientService],
})
export class ArchivistClientModule {}