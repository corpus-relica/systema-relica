import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ArchivistModule } from 'src/archivist/archivist.module';
import { ModelModule } from 'src/model/model.module';

@Module({
  imports: [ArchivistModule, ModelModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
