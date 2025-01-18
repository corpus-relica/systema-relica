import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentController } from './environment.controller.js';
import { EnvironmentService } from './environment.service.js';
import { EnvFact } from './envFact.entity.js';
import { EnvModel } from './envModel.entity.js';
import { EnvSelectedEntity } from './envSelectedEntity.entity.js';
import { UserEnvironment } from './user-environment.entity.js';
import { ModelModule } from '../model/model.module.js';
import { ArchivistModule } from '../archivist/archivist.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EnvFact,
      EnvModel,
      UserEnvironment,
      EnvSelectedEntity,
    ]),
    ModelModule,
    ArchivistModule,
  ],
  providers: [EnvironmentService],
  controllers: [EnvironmentController],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
