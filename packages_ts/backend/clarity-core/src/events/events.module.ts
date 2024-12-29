import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway.js';
import { EnvironmentModule } from '../environment/environment.module.js';
import { ArchivistModule } from '../archivist/archivist.module.js';
import { REPLModule } from '../repl/repl.module.js';

@Module({
  imports: [EnvironmentModule, ArchivistModule, REPLModule],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
