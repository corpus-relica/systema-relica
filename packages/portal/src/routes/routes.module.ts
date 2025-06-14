import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SearchController } from './search.controller';
import { EntitiesController } from './entities.controller';
import { FactsController } from './facts.controller';
import { SystemController } from './system.controller';
import { ModelController } from './model.controller';
import { EnvironmentController } from './environment.controller';
import { PrismController } from './prism.controller';

@Module({
  controllers: [
    AuthController,
    SearchController,
    EntitiesController,
    FactsController,
    SystemController,
    ModelController,
    EnvironmentController,
    PrismController,
  ],
})
export class RoutesModule {}