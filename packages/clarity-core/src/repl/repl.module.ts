import { Module } from '@nestjs/common';
import { REPLService } from './repl.service';
import { REPLController } from './repl.controller';

@Module({
  imports: [],
  providers: [REPLService],
  controllers: [REPLController],
  exports: [REPLService],
})
export class REPLModule {}
