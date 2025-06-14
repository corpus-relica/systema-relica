import { Module } from '@nestjs/common';
import { PrismWebSocketGateway } from './websocket.gateway';
import { SetupModule } from '../setup/setup.module';
import { CacheModule } from '../cache/cache.module';
import { HealthModule } from '../health/health.module';

@Module({
  imports: [SetupModule, CacheModule, HealthModule],
  providers: [PrismWebSocketGateway],
  exports: [PrismWebSocketGateway],
})
export class WebSocketModule {}