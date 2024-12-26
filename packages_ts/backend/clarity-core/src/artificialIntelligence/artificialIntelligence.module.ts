import { Module } from '@nestjs/common';
import { ArtificialIntelligenceService } from './artificialIntelligence.service';
import { ArtificialIntelligenceController } from './artificialIntelligence.controller';
import { ArchivistModule } from '../archivist/archivist.module';

@Module({
  imports: [ArchivistModule],
  providers: [ArtificialIntelligenceService],
  controllers: [ArtificialIntelligenceController],
  exports: [ArtificialIntelligenceService],
})
export class ArtificialIntelligenceModule {}
