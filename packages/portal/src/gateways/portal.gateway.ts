import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException 
} from '@nestjs/websockets';
import { Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { 
  ServiceMessage, 
  ServiceResponse, 
  ClientMessage, 
  ClientResponse,
  ClientEvent
} from '../types/websocket-messages';

interface ConnectedClient {
  userId: string;
  environmentId?: string;
  socketToken?: string;
  isGuest?: boolean;
  socket: Socket;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket'],
})
export class PortalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PortalGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();
  private socketTokens = new Map<string, { userId: string; createdAt: number; isGuest?: boolean }>();

  // Error codes aligned with Clojure implementation
  private readonly errorCodes = {
    'service-unavailable': 1001,
    'internal-error': 1002,
    'timeout': 1003,
    'service-overloaded': 1004,
    'validation-error': 1101,
    'missing-required-field': 1102,
    'invalid-field-format': 1103,
    'invalid-reference': 1104,
    'constraint-violation': 1105,
    'unauthorized': 1301,
    'forbidden': 1302,
    'not-found': 1401,
    'bad-request': 1402,
    'unknown-message-type': 1403,
    'invalid-message-format': 1404,
  };

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  private createResponse(
    id: string,
    success: boolean,
    data: any,
    requestId?: string
  ): ServiceResponse {
    if (success) {
      return {
        id,
        type: 'response',
        service: 'portal' as any,
        action: '',
        payload: data,
        success: true,
        request_id: requestId,
      };
    } else {
      const errorType = typeof data === 'object' && data.type ? data.type : 'internal-error';
      const errorMsg = typeof data === 'object' && data.message ? data.message : String(data);
      const errorDetails = typeof data === 'object' && data.details ? data.details : null;
      const errorCode = this.errorCodes[errorType] || 1002;

      return {
        id,
        type: 'response',
        service: 'portal' as any,
        action: '',
        payload: null,
        success: false,
        error: `${errorType}: ${errorMsg}`,
        request_id: requestId,
      };
    }
  }

  private generateSocketToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateJWT(jwt: string): string | null {
    // TODO: Implement JWT validation by calling Shutter service
    // For now, return a mock user ID
    if (jwt && jwt.length > 10) {
      return 'user-123'; // Mock user ID
    }
    return null;
  }

  private broadcastToEnvironment(environmentId: string, message: any) {
    for (const [clientId, clientData] of this.connectedClients) {
      if (clientData.environmentId === environmentId) {
        clientData.socket.emit('message', message);
      }
    }
  }

  @SubscribeMessage('auth')
  async handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { jwt: string }
  ): Promise<any> {
    try {
      const userId = this.validateJWT(payload.jwt);
      if (!userId) {
        return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Invalid JWT' });
      }

      const socketToken = this.generateSocketToken();
      this.socketTokens.set(socketToken, {
        userId,
        createdAt: Date.now(),
      });

      this.connectedClients.set(client.id, {
        userId,
        socketToken,
        socket: client,
      });

      return this.createResponse(client.id, true, {
        token: socketToken,
        user_id: userId,
      });
    } catch (error) {
      this.logger.error('Auth error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Authentication failed' });
    }
  }

  @SubscribeMessage('guest-auth')
  async handleGuestAuth(@ConnectedSocket() client: Socket): Promise<any> {
    try {
      const socketToken = this.generateSocketToken();
      const guestId = 'guest-user';

      this.socketTokens.set(socketToken, {
        userId: guestId,
        createdAt: Date.now(),
        isGuest: true,
      });

      this.connectedClients.set(client.id, {
        userId: guestId,
        socketToken,
        isGuest: true,
        socket: client,
      });

      return this.createResponse(client.id, true, {
        token: socketToken,
        user_id: guestId,
      });
    } catch (error) {
      this.logger.error('Guest auth error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Guest authentication failed' });
    }
  }

  @SubscribeMessage('ping')
  async handlePing(@ConnectedSocket() client: Socket): Promise<any> {
    return this.createResponse(client.id, true, {
      message: 'Pong',
      timestamp: Date.now(),
    });
  }

  @SubscribeMessage('selectEntity')
  async handleSelectEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { uid: string; user_id: string }
  ): Promise<any> {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
      }

      // TODO: Forward to Aperture service via WebSocket
      // For now, return success and broadcast event
      const environmentId = clientData.environmentId || '1';
      
      // Broadcast entity selected event to environment
      this.broadcastToEnvironment(environmentId, {
        id: 'system',
        type: 'portal:entitySelected',
        payload: {
          type: 'aperture.entity/selected',
          entity_uid: payload.uid,
          user_id: payload.user_id,
          environment_id: environmentId,
        },
      });

      return this.createResponse(client.id, true, {
        message: 'Entity selected',
      });
    } catch (error) {
      this.logger.error('Select entity error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to select entity' });
    }
  }

  @SubscribeMessage('selectNone')
  async handleSelectNone(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { user_id: string }
  ): Promise<any> {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
      }

      // TODO: Forward to Aperture service via WebSocket
      const environmentId = clientData.environmentId || '1';
      
      // Broadcast entity deselected event to environment
      this.broadcastToEnvironment(environmentId, {
        id: 'system',
        type: 'portal:entitySelectedNone',
        payload: {
          type: 'aperture.entity/deselected',
          user_id: payload.user_id,
          environment_id: environmentId,
        },
      });

      return this.createResponse(client.id, true, {
        message: 'Entity deselected',
      });
    } catch (error) {
      this.logger.error('Select none error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to deselect entity' });
    }
  }

  // Placeholder handlers for other message types
  @SubscribeMessage('loadSpecializationHierarchy')
  async handleLoadSpecializationHierarchy(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { uid: string; user_id: string }
  ): Promise<any> {
    // TODO: Implement Aperture service call
    return this.createResponse(client.id, true, {
      message: 'Specialization hierarchy loaded',
      environment: {},
    });
  }

  @SubscribeMessage('clearEnvironmentEntities')
  async handleClearEnvironmentEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { user_id: string }
  ): Promise<any> {
    // TODO: Implement Aperture service call
    return this.createResponse(client.id, true, {
      message: 'Environment entities cleared',
    });
  }

  @SubscribeMessage('loadAllRelatedFacts')
  async handleLoadAllRelatedFacts(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { uid: string; user_id: string }
  ): Promise<any> {
    // TODO: Implement Aperture service call
    return this.createResponse(client.id, true, {
      message: 'All related facts loaded',
      facts: [],
    });
  }

  @SubscribeMessage('chatUserInput')
  async handleChatUserInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string; user_id: string }
  ): Promise<any> {
    // TODO: Implement NOUS service call
    return this.createResponse(client.id, true, {
      message: 'Chat user input processed',
      response: {},
    });
  }

  // Prism setup handlers
  @SubscribeMessage('prism/startSetup')
  async handlePrismStartSetup(@ConnectedSocket() client: Socket): Promise<any> {
    // TODO: Implement Prism service call
    return this.createResponse(client.id, true, {
      result: {},
    });
  }

  @SubscribeMessage('prism/createUser')
  async handlePrismCreateUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { username: string; password: string; confirmPassword: string }
  ): Promise<any> {
    // TODO: Implement Prism service call
    return this.createResponse(client.id, true, {
      result: {},
    });
  }

  // Generic message handler for unrecognized message types
  @SubscribeMessage('*')
  handleUnknownMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any): any {
    this.logger.warn(`Unknown message type received from ${client.id}:`, data);
    return this.createResponse(client.id, false, {
      type: 'unknown-message-type',
      message: `Unknown message type`,
    });
  }
}