import { Module } from '@nestjs/common';
import { ApertureGateway } from './aperture.gateway';
import { EnvironmentModule } from '../environment/environment.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [EnvironmentModule, ServicesModule],
  providers: [ApertureGateway],
  exports: [ApertureGateway],
})
export class WebSocketModule {}