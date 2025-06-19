import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentService } from './environment.service';
import { Environment } from './entities/environment.entity';
import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';

@Module({
  imports: [TypeOrmModule.forFeature([Environment])],
  providers: [EnvironmentService, ArchivistWebSocketClientService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}