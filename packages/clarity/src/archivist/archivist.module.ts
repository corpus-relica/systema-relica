import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ArchivistService } from './archivist.service';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [ConfigModule, ServicesModule],
  providers: [ArchivistService],
  controllers: [],
  exports: [ArchivistService],
})
export class ArchivistModule {}
