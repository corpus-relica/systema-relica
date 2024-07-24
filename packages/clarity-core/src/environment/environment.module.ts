import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentController } from './environment.controller';
import { EnvironmentService } from './environment.service';
import { EnvFact } from './envFact.entity';
import { EnvModel } from './envModel.entity';
import { EnvSelectedEntity } from './envSelectedEntity.entity';
import { ModelModule } from '../model/model.module';
import { ArchivistModule } from '../archivist/archivist.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EnvFact, EnvModel, EnvSelectedEntity]),
    ModelModule,
    ArchivistModule,
  ],
  providers: [EnvironmentService],
  controllers: [EnvironmentController],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
