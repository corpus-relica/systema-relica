import { Module } from '@nestjs/common';
import { DSLParser } from './dsl-parser.service';
import { VMExecutor } from './vm-executor.service';
import { EnvironmentModule } from 'src/environment/environment.module';

@Module({
  providers: [DSLParser, VMExecutor],
  exports: [DSLParser, VMExecutor],
  imports: [EnvironmentModule],
})
export class DSLVMModule {}
