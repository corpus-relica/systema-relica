import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StateService } from './state.service';
import { AppState } from './appState.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AppState])],
  providers: [StateService],
  exports: [StateService],
})
export class StateModule {}
