import { Module } from '@nestjs/common';
import { AuthGuard } from './guards/auth.guard';
import { AuthMiddleware } from './middleware/auth.middleware';
import { RestClientsModule } from './services/rest-clients.module';
import { WebSocketClientsModule } from './services/websocket-clients.module';

@Module({
  imports: [RestClientsModule, WebSocketClientsModule],
  providers: [AuthGuard, AuthMiddleware],
  exports: [AuthGuard, AuthMiddleware, RestClientsModule, WebSocketClientsModule],
})
export class SharedModule {}