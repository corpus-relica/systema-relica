import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EnvironmentModule } from 'src/environment/environment.module';
import { ArchivistModule } from 'src/archivist/archivist.module';
import { REPLModule } from 'src/repl/repl.module';

@Module({
  imports: [EnvironmentModule, ArchivistModule, REPLModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
