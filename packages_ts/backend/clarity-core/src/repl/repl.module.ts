import { Module } from '@nestjs/common';
import { REPLService } from './repl.service.js';
import { REPLController } from './repl.controller.js';
import { ArchivistModule } from '../archivist/archivist.module.js';
import { EnvironmentModule } from '../environment/environment.module.js';
import { StateModule } from '../state/state.module.js';

@Module({
  imports: [ArchivistModule, EnvironmentModule, StateModule],
  providers: [REPLService],
  controllers: [REPLController],
  exports: [REPLService],
})
export class REPLModule {}
