import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ArchivistModule } from 'src/archivist/archivist.module';

@Module({
  imports: [ArchivistModule],
  providers: [ModelService],
  exports: [ModelService],
})
export class ModelModule {}
