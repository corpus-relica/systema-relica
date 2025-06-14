import { Module } from '@nestjs/common';
import { ApertureGateway } from './aperture.gateway';
import { EnvironmentModule } from '../environment/environment.module';

@Module({
  imports: [EnvironmentModule],
  providers: [ApertureGateway],
  exports: [ApertureGateway],
})
export class WebSocketModule {}