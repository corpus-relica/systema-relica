import { Module } from '@nestjs/common';
import { WebSocketGateway } from './websocket.gateway';
import { SetupModule } from '../setup/setup.module';
import { CacheModule } from '../cache/cache.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [SetupModule, CacheModule, HealthModule],
  providers: [WebSocketGateway],
  exports: [WebSocketGateway],
})
export class WebSocketModule {}