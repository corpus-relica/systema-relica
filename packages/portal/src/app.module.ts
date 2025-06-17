import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { WebSocketClientsModule } from './services/websocket-clients.module';
import { RestClientsModule } from './services/rest-clients.module';
import { PortalGateway } from './gateways/portal.gateway';
import { RoutesModule } from './routes/routes.module';
import { AuthGuard } from './guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '../../.env.local'],
    }),
    WebSocketClientsModule,
    RestClientsModule,
    RoutesModule,
  ],
  providers: [
    PortalGateway,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
