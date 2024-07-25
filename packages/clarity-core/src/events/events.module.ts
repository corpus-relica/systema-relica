import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EnvironmentModule } from 'src/environment/environment.module';
import { ArchivistModule } from 'src/archivist/archivist.module';
import { SemanticModelModule } from 'src/semanticModel/semanticModel.module';

@Module({
  imports: [EnvironmentModule, ArchivistModule, SemanticModelModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
