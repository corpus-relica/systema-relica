import { Module, forwardRef } from '@nestjs/common';
import { EventsGateway } from './events.gateway';
import { ArchivistModule } from 'src/archivist/archivist.module';
import { ModelModule } from 'src/model/model.module';
import { ServicesModule } from 'src/services/services.module';

@Module({
  imports: [
    forwardRef(() => ArchivistModule), 
    forwardRef(() => ModelModule), 
    forwardRef(() => ServicesModule)
  ],
  providers: [EventsGateway],
  exports: [EventsGateway],
})
export class EventsModule {}
