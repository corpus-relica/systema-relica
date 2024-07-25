import { Module } from '@nestjs/common';
import { REPLService } from './repl.service';
import { REPLController } from './repl.controller';
import { ArchivistModule } from '../archivist/archivist.module';
import { EnvironmentModule } from '../environment/environment.module';

@Module({
  imports: [ArchivistModule, EnvironmentModule],
  providers: [REPLService],
  controllers: [REPLController],
  exports: [REPLService],
})
export class REPLModule {}
