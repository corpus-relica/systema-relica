import { Module } from '@nestjs/common';
import { ModelController } from './model.controller';
import { ModelService } from './model.service';
import { ArchivistModule } from 'src/archivist/archivist.module';

@Module({
  imports: [ArchivistModule],
  providers: [ModelService],
  controllers: [ModelController],
  exports: [ModelService],
})
export class ModelModule {}
