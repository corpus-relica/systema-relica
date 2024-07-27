import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateService } from './state.service';
import { ModelSession } from './modelSession.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModelSession])],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
