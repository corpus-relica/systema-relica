import { Module } from '@nestjs/common';
import { ArtificialIntelligenceService } from './artificialIntelligence.service.js';
import { ArtificialIntelligenceController } from './artificialIntelligence.controller.js';
import { ArchivistModule } from '../archivist/archivist.module.js';

@Module({
  imports: [ArchivistModule],
  providers: [ArtificialIntelligenceService],
  controllers: [ArtificialIntelligenceController],
  exports: [ArtificialIntelligenceService],
})
export class ArtificialIntelligenceModule {}
