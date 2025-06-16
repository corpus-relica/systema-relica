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
import { Injectable } from '@nestjs/common';
import { SetupService } from '../setup/setup.service';
import { CacheService } from '../cache/cache.service';
import { HealthService } from '../health/health.service';

@Injectable()
@WebSocketGateway({ 
  cors: true,
  transports: ['websocket'],
})
export class PrismWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private clients: Set<Socket> = new Set();

  constructor(
    private setupService: SetupService,
    private cacheService: CacheService,
    private healthService: HealthService,
  ) {}

  afterInit() {
    // Wire up the circular dependency after initialization
    this.setupService.setWebSocketGateway(this);
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
  handleHeartbeat(@MessageBody() payload: any) {
    console.log('Heartbeat received:', payload);
    return {
      success: true,
      data: {
        receivedAt: Date.now(),
        serverTime: new Date().toISOString(),
      },
    };
  }

  @SubscribeMessage(':prism.setup/get-status')
  handleGetSetupStatus() {
    console.log('Handling setup status request');
    const status = this.setupService.getSetupState();
    return {
      success: true,
      data: status,
    };
  }

  @SubscribeMessage(':prism.setup/start')
  handleStartSetup() {
    console.log('Starting setup sequence via WebSocket');
    this.setupService.startSetup();
    return {
      success: true,
      message: 'Setup sequence started',
    };
  }

  @SubscribeMessage(':prism.setup/create-user')
  handleCreateUser(@MessageBody() payload: any) {
    const { username, password, confirmPassword } = payload || {};
    console.log('Creating admin user via WebSocket:', username);

    if (!username || !password || !confirmPassword) {
      return {
        success: false,
        error: {
          code: 'validation-error',
          type: 'input-validation',
          message: 'Missing required fields',
        },
      };
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        error: {
          code: 'validation-error',
          type: 'input-validation',
          message: 'Passwords do not match',
        },
      };
    }

    // Submit credentials to setup service
    this.setupService.submitCredentials(username, password);
    
    return {
      success: true,
      data: {
        message: 'Admin user creation initiated',
        user: {
          username,
          role: 'admin',
        },
      },
    };
  }

  @SubscribeMessage('reset-system')
  async handleResetSystem() {
    console.log('🚨 Resetting system state via WebSocket');
    try {
      const result = await this.setupService.resetSystem();
      return {
        success: result.success,
        message: result.message,
        errors: result.errors,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('System reset failed via WebSocket:', error);
      return {
        success: false,
        message: `System reset failed: ${error.message}`,
        errors: [error.message],
        timestamp: new Date().toISOString(),
      };
    }
  }

  @SubscribeMessage(':prism.cache/rebuild')
  async handleCacheRebuild() {
    console.log('Starting cache rebuild via WebSocket');
    try {
      const result = await this.cacheService.rebuildAllCaches();
      return {
        success: result,
        message: result 
          ? 'Cache rebuild completed successfully'
          : 'Cache rebuild failed',
      };
    } catch (error) {
      console.error('Failed to start cache rebuild:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to start cache rebuild',
      };
    }
  }

  @SubscribeMessage(':prism.cache/status')
  handleGetCacheStatus() {
    console.log('Getting cache rebuild status');
    const status = this.cacheService.getRebuildStatus();
    return {
      success: true,
      data: status,
    };
  }

  @SubscribeMessage(':prism.health/status')
  async handleGetHealthStatus() {
    console.log('Getting system health status');
    const health = await this.healthService.checkSystemHealth();
    return {
      success: true,
      data: health,
    };
  }

  @SubscribeMessage(':prism.health/neo4j')
  async handleGetNeo4jHealth() {
    console.log('Getting Neo4j health status');
    const health = await this.healthService.checkNeo4jHealth();
    return {
      success: true,
      data: health,
    };
  }

  @SubscribeMessage(':prism.health/cache')
  async handleGetCacheHealthStatus() {
    console.log('Getting cache health status');
    const health = await this.healthService.checkCacheHealth();
    return {
      success: true,
      data: health,
    };
  }

  public broadcastSetupUpdate(data: any) {
    this.broadcast({
      type: ':prism.setup/event',
      payload: data,
    });
  }

  public broadcastCacheUpdate(data: any) {
    this.broadcast({
      type: ':prism.cache/rebuild-progress',
      payload: data,
    });
  }

  private broadcast(message: any) {
    this.clients.forEach(client => {
      if (client.connected) {
        client.emit('message', message);
      }
    });
  }
}