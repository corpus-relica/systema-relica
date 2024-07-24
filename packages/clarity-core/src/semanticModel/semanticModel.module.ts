import { Module } from '@nestjs/common';
import { SemanticModelService } from './semanticModel.service';
import { REPLModule } from 'src/repl/repl.module';

@Module({
  imports: [REPLModule],
  providers: [SemanticModelService],
  exports: [SemanticModelService],
})
export class SemanticModelModule {}
