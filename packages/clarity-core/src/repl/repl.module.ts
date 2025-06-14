import { Module } from '@nestjs/common';
import { REPLService } from './repl.service';
import { REPLController } from './repl.controller';
import { ArchivistModule } from '../archivist/archivist.module';
import { StateModule } from 'src/state/state.module';

@Module({
  imports: [ArchivistModule, StateModule],
  providers: [REPLService],
  controllers: [REPLController],
  exports: [REPLService],
})
export class REPLModule {}
