import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EnvironmentModule } from 'src/environment/environment.module';
import { ArchivistModule } from 'src/archivist/archivist.module';

@Module({
  imports: [EnvironmentModule, ArchivistModule],
  providers: [EventsGateway],
})
export class EventsModule {}
