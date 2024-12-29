import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModellingService } from './modelling.service.js';
import { ModellingSession } from './modellingSession.entity.js';
import { ModellingController } from './modelling.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ModellingSession])],
  providers: [ModellingService],
  controllers: [ModellingController],
  exports: [],
})
export class ModellingModule {}
