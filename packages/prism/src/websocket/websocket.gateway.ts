import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { SetupService } from '../setup/setup.service';
import { CacheService } from '../cache/cache.service';
import { HealthService } from '../health/health.service';
import { PrismActions, PrismEvents, SetupStatusBroadcastEvent, toResponse, toErrorResponse, decodeRequest, toBinaryBroadcastEvent } from '@relica/websocket-contracts';

@Injectable()
@WebSocketGateway({ 
  cors: true,
  transports: ['websocket'],
})
export class PrismWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private readonly logger = new Logger(PrismWebSocketGateway.name);

  @WebSocketServer()
  server: Server;

  private clients: Set<Socket> = new Set();

  // Binary serialization methods now provided by shared websocket-contracts utilities

  constructor(
    private setupService: SetupService,
    private cacheService: CacheService,
    private healthService: HealthService,
  ) {}

  afterInit() {
    // Wire up the circular dependency after initialization
    this.setupService.setWebSocketGateway(this);
    this.cacheService.setWebSocketGateway(this);
  }

  handleConnection(client: Socket) {
    this.clients.add(client);
    console.log(`Client connected. Total clients: ${this.clients.size}`);
    
    // Send connection acknowledgment
    client.emit('message', {
      type: ':relica.connection/open',
      payload: {
        connectionId: `conn-${Date.now()}`,
        connectedAt: Date.now(),
        clientInfo: {
          ip: 'unknown',
          userAgent: 'unknown',
        },
      },
    });
  }

  handleDisconnect(client: Socket) {
    this.clients.delete(client);
    console.log(`Client disconnected. Total clients: ${this.clients.size}`);
  }

  @SubscribeMessage(':relica.app/heartbeat')
  handleHeartbeat(@MessageBody() message: any) {
    try {
      const payload = message.payload;
      this.logger.log('Heartbeat received:', payload);
      const data = {
        receivedAt: Date.now(),
        serverTime: new Date().toISOString(),
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error('Heartbeat failed', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PrismActions.GET_SETUP_STATUS)
  handleGetSetupStatus(@MessageBody() message: any) {
    try {
      const decodedMessage = decodeRequest(message);
      this.logger.log('Handling setup status request');
      const status = this.setupService.getSetupState();
      return toResponse(status, decodedMessage.id || message.id);
    } catch (error) {
      this.logger.error('Failed to get setup status', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PrismActions.START_SETUP)
  handleStartSetup(@MessageBody() message: any) {
    try {
      this.logger.log('Starting setup sequence via WebSocket');
      this.setupService.startSetup();
      const data = { message: 'Setup sequence started' };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error('Failed to start setup', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PrismActions.CREATE_USER)
  handleCreateUser(@MessageBody() message: any) {
    try {
      const { username, email, password } = message.payload || {};
      this.logger.log('Creating admin user via WebSocket:', username);

      if (!username || !password || !email) {
        const error = new Error('Missing required fields: username, email, and password are required');
        this.logger.error('User creation validation failed', error);
        return toErrorResponse(error, message.id);
      }

      // Submit credentials to setup service
      this.setupService.submitCredentials(username, email, password);
      
      const data = {
        message: 'Admin user creation initiated',
        user: {
          username,
          role: 'admin',
        },
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error('Failed to create user', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PrismActions.RESET_SYSTEM)
  async handleResetSystem(@MessageBody() message: any) {
    try {
      this.logger.warn('🚨 Resetting system state via WebSocket');
      const result = await this.setupService.resetSystem();
      const data = {
        success: result.success,
        message: result.message,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error('System reset failed via WebSocket', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(':prism.cache/rebuild')
  async handleCacheRebuild(@MessageBody() message: any) {
    try {
      const decodedMessage = decodeRequest(message);
      this.logger.log('Starting cache rebuild via WebSocket');
      const result = await this.cacheService.rebuildAllCaches();
      const data = {
        success: result,
        message: result 
          ? 'Cache rebuild completed successfully'
          : 'Cache rebuild failed',
      };
      return toResponse(data, decodedMessage.id || message.id);
    } catch (error) {
      this.logger.error('Failed to start cache rebuild', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(':prism.cache/status')
  handleGetCacheStatus(@MessageBody() message: any) {
    try {
      this.logger.log('Getting cache rebuild status');
      const status = this.cacheService.getRebuildStatus();
      return toResponse(status, message.id);
    } catch (error) {
      this.logger.error('Failed to get cache status', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(':prism.health/status')
  async handleGetHealthStatus(@MessageBody() message: any) {
    try {
      this.logger.log('Getting system health status');
      const health = await this.healthService.checkSystemHealth();
      return toResponse(health, message.id);
    } catch (error) {
      this.logger.error('Failed to get health status', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(':prism.health/neo4j')
  async handleGetNeo4jHealth(@MessageBody() message: any) {
    try {
      this.logger.log('Getting Neo4j health status');
      const health = await this.healthService.checkNeo4jHealth();
      return toResponse(health, message.id);
    } catch (error) {
      this.logger.error('Failed to get Neo4j health', error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(':prism.health/cache')
  async handleGetCacheHealthStatus(@MessageBody() message: any) {
    try {
      this.logger.log('Getting cache health status');
      const health = await this.healthService.checkCacheHealth();
      return toResponse(health, message.id);
    } catch (error) {
      this.logger.error('Failed to get cache health', error);
      return toErrorResponse(error, message.id);
    }
  }

  public broadcastSetupUpdate(setupStatus: any) {
    // Create canonical setup status broadcast event
    const broadcastEvent: SetupStatusBroadcastEvent = {
      type: PrismEvents.SETUP_STATUS_UPDATE,
      data: setupStatus,
    };
    
    console.log('Broadcasting canonical setup status update:', broadcastEvent);
    this.broadcast(broadcastEvent);
  }

  public broadcastCacheUpdate(data: any) {
    this.broadcast({
      type: ':prism.cache/rebuild-progress',
      payload: data,
    });
  }

  private broadcast(message: any) {
    const broadcastEvent = toBinaryBroadcastEvent(message.type, message.data || message);
    this.clients.forEach(client => {
      if (client.connected) {
        client.emit(message.type, broadcastEvent);
      }
    });
  }
}
