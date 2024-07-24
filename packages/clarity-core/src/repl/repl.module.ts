import { Module } from '@nestjs/common';
import { REPLService } from './repl.service';

@Module({
  imports: [],
  providers: [REPLService],
  controllers: [],
  exports: [REPLService],
})
export class REPLModule {}
