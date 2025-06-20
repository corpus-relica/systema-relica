import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SetupModule } from './setup/setup.module';
import { HealthModule } from './health/health.module';
import { BatchModule } from './batch/batch.module';
import { DatabaseModule } from './database/database.module';
import { WebSocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../../.env.local'],
    }),
    DatabaseModule,
    SetupModule,
    HealthModule,
    BatchModule,
    WebSocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}