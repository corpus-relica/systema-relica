import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModellingService } from './modelling.service';
import { ModellingSession } from './modellingSession.entity';
import { ModellingController } from './modelling.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ModellingSession])],
  providers: [ModellingService],
  controllers: [ModellingController],
  exports: [],
})
export class ModellingModule {}
