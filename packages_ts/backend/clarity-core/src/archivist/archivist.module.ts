import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ArchivistService } from './archivist.service.js';

@Module({
  imports: [HttpModule],
  providers: [ArchivistService],
  controllers: [],
  exports: [ArchivistService],
})
export class ArchivistModule {}
