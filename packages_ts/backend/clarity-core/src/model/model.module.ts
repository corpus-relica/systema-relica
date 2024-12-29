import { Module } from '@nestjs/common';
import { ModelController } from './model.controller.js';
import { ModelService } from './model.service.js';
import { ArchivistModule } from '../archivist/archivist.module.js';

@Module({
  imports: [ArchivistModule],
  providers: [ModelService],
  controllers: [ModelController],
  exports: [ModelService],
})
export class ModelModule {}
