import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { EnvironmentService } from '../environment/environment.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/aperture',
})
export class ApertureGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ApertureGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly environmentService: EnvironmentService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('aperture.connection/established', {
      message: 'Connected to Aperture service',
      timestamp: new Date().toISOString(),
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Environment Operations
  @SubscribeMessage('aperture.environment/get')
  async getEnvironment(
    @MessageBody() payload: { userId: string; environmentId?: string },
  ) {
    try {
      const { userId, environmentId } = payload;
      let environment;
      
      if (environmentId) {
        environment = await this.environmentService.findOne(environmentId, userId);
      } else {
        environment = await this.environmentService.findDefaultForUser(userId);
      }

      return {
        success: true,
        data: environment,
      };
    } catch (error) {
      this.logger.error('Failed to get environment', error);
      return {
        success: false,
        error: {
          code: 'environment-get-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  @SubscribeMessage('aperture.environment/list')
  async listEnvironments(@MessageBody() payload: { userId: string }) {
    try {
      const { userId } = payload;
      const environments = await this.environmentService.findAll(userId);

      return {
        success: true,
        data: environments,
      };
    } catch (error) {
      this.logger.error('Failed to list environments', error);
      return {
        success: false,
        error: {
          code: 'environment-list-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  @SubscribeMessage('aperture.environment/create')
  async createEnvironment(
    @MessageBody() payload: { userId: string; name: string },
  ) {
    try {
      const { userId, name } = payload;
      const environment = await this.environmentService.create({ userId, name });

      return {
        success: true,
        data: environment,
      };
    } catch (error) {
      this.logger.error('Failed to create environment', error);
      return {
        success: false,
        error: {
          code: 'environment-create-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  // Entity Operations
  @SubscribeMessage('aperture.entity/select')
  async selectEntity(
    @MessageBody() payload: { userId: string; environmentId: string; entityUid: string },
  ) {
    try {
      const { userId, environmentId, entityUid } = payload;
      const environment = await this.environmentService.selectEntity(
        environmentId,
        userId,
        entityUid,
      );

      // Broadcast to all clients
      this.server.emit('aperture.entity/selected', {
        entityUid,
        userId,
        environmentId,
      });

      return {
        success: true,
        data: {
          success: true,
          selectedEntity: entityUid,
        },
      };
    } catch (error) {
      this.logger.error('Failed to select entity', error);
      return {
        success: false,
        error: {
          code: 'entity-select-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  @SubscribeMessage('aperture.entity/deselect')
  async deselectEntity(
    @MessageBody() payload: { userId: string; environmentId: string },
  ) {
    try {
      const { userId, environmentId } = payload;
      await this.environmentService.deselectEntity(environmentId, userId);

      // Broadcast to all clients
      this.server.emit('aperture.entity/deselected', {
        userId,
        environmentId,
      });

      return {
        success: true,
        data: {
          success: true,
        },
      };
    } catch (error) {
      this.logger.error('Failed to deselect entity', error);
      return {
        success: false,
        error: {
          code: 'entity-deselect-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  @SubscribeMessage('aperture.environment/clear')
  async clearEnvironment(
    @MessageBody() payload: { userId: string; environmentId: string },
  ) {
    try {
      const { userId, environmentId } = payload;
      const environment = await this.environmentService.findOne(environmentId, userId);
      const factUids = environment.facts.map((fact) => fact.fact_uid);
      
      await this.environmentService.clearFacts(environmentId, userId);

      // Broadcast to all clients
      this.server.emit('aperture.facts/unloaded', {
        factUids,
        modelUids: [],
        userId,
        environmentId,
      });

      return {
        success: true,
        data: {
          success: true,
        },
      };
    } catch (error) {
      this.logger.error('Failed to clear environment', error);
      return {
        success: false,
        error: {
          code: 'environment-clear-failed',
          type: 'database-error',
          message: error.message,
        },
      };
    }
  }

  // Heartbeat
  @SubscribeMessage('relica.app/heartbeat')
  async heartbeat(@MessageBody() payload: { timestamp: number }) {
    return {
      success: true,
      data: {
        timestamp: Date.now(),
      },
    };
  }

  // Helper method to broadcast facts loaded
  broadcastFactsLoaded(
    facts: any[],
    userId: string,
    environmentId: string,
  ) {
    this.server.emit('aperture.facts/loaded', {
      facts,
      userId,
      environmentId,
    });
  }

  // Helper method to broadcast facts unloaded
  broadcastFactsUnloaded(
    factUids: string[],
    modelUids: string[],
    userId: string,
    environmentId: string,
  ) {
    this.server.emit('aperture.facts/unloaded', {
      factUids,
      modelUids,
      userId,
      environmentId,
    });
  }
}