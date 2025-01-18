import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REPLService } from './repl.service.js';
import { REPLController } from './repl.controller.js';
import { ArchivistModule } from '../archivist/archivist.module.js';
import { EnvironmentModule } from '../environment/environment.module.js';
import { StateModule } from '../state/state.module.js';
import { UserEnvironment } from '../environment/user-environment.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEnvironment]),
    ArchivistModule,
    EnvironmentModule,
    StateModule,
  ],
  providers: [REPLService],
  controllers: [REPLController],
  exports: [REPLService],
})
export class REPLModule {}
