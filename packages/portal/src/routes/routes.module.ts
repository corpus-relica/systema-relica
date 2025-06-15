import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { SearchController } from './search.controller';
import { EntitiesController } from './entities.controller';
import { FactsController } from './facts.controller';
import { SystemController } from './system.controller';
import { ModelController } from './model.controller';
import { EnvironmentController } from './environment.controller';
import { PrismController } from './prism.controller';
import { WebSocketClientsModule } from '../services/websocket-clients.module';
import { RestClientsModule } from '../services/rest-clients.module';

@Module({
  imports: [WebSocketClientsModule, RestClientsModule],
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