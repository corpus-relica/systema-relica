import { Module } from '@nestjs/common';
import { SemanticModelService } from './semanticModel.service';
import { DSLVMModule } from 'src/dslvm/dslvm.module';
// import { SemanticModelController } from './semantic-model.controller';

@Module({
  imports: [DSLVMModule],
  providers: [SemanticModelService],
  // controllers: [SemanticModelController],
  exports: [SemanticModelService],
})
export class SemanticModelModule {}
