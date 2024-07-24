import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { EnvironmentModule } from 'src/environment/environment.module';
import { ArchivistModule } from 'src/archivist/archivist.module';
import { DSLVMModule } from 'src/dslvm/dslvm.module';

@Module({
  imports: [EnvironmentModule, ArchivistModule, DSLVMModule],
  providers: [EventsGateway],
})
export class EventsModule {}
