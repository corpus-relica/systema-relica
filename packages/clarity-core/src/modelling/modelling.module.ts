import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModellingService } from './modelling.service';
import { ModellingSession } from './modellingSession.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModellingSession])],
  providers: [ModellingService],
  controllers: [],
  exports: [],
})
export class ModellingModule {}
