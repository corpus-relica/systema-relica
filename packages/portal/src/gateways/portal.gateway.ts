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
import { Logger, Injectable, Inject } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { ShutterRestClientService } from '../services/shutter-rest-client.service';
import { ApertureWebSocketClientService } from '../services/aperture-websocket-client.service';
import { NousWebSocketClientService } from '../services/nous-websocket-client.service';
import { PrismWebSocketClientService } from '../services/prism-websocket-client.service';
import { 
  ServiceMessage, 
  ServiceResponse, 
  ClientMessage, 
  ClientResponse,
  ClientEvent
} from '../types/websocket-messages';
import { 
  PortalUserActions,
  PortalSystemEvents,
  SelectEntityRequestSchema,
  SelectFactRequestSchema,
  SelectNoneRequestSchema,
  LoadSpecializationHierarchyRequestSchema,
  LoadEntityRequestSchema,
  ClearEntitiesRequestSchema,
  LoadAllRelatedFactsRequestSchema,
  LoadSubtypesConeRequestSchema,
  UnloadEntityRequestSchema,
  UnloadSubtypesConeRequestSchema,
  DeleteEntityRequestSchema,
  DeleteFactRequestSchema,
  LoadEntitiesRequestSchema,
  UnloadEntitiesRequestSchema,
  GetSpecializationHierarchyRequestSchema,
  type SelectEntityRequest,
  type SelectFactRequest,
  type SelectNoneRequest,
  type LoadSpecializationHierarchyRequest,
  type StandardResponse,
} from '@relica/websocket-contracts';
import customParser from 'socket.io-msgpack-parser';

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
  parser: customParser,
})

export class PortalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PortalGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();
  private socketTokens = new Map<string, { userId: string; createdAt: number; isGuest?: boolean }>();

  constructor(
    private readonly apertureClient: ApertureWebSocketClientService,
    private readonly shutterClient: ShutterRestClientService,
    private readonly nousClient: NousWebSocketClientService,
    private readonly prismClient: PrismWebSocketClientService,
  ) {
    // Set up the broadcast forwarding after initialization
    this.prismClient.setPortalGateway(this);
    this.apertureClient.setPortalGateway(this);
  }

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
        success: true,
        data: data,
      };
    } else {
      const errorType = typeof data === 'object' && data.type ? data.type : 'internal-error';
      const errorMsg = typeof data === 'object' && data.message ? data.message : String(data);
      const errorDetails = typeof data === 'object' && data.details ? data.details : null;
      const errorCode = this.errorCodes[errorType] || 1002;

      return {
        id,
        type: 'response',
        success: false,
        error: `${errorType}: ${errorMsg}`,
      };
    }
  }

  private generateSocketToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateJWT(jwt: string): Promise<{ userId: string; user: any } | null> {
    try {
      const validationResult = await this.shutterClient.validateToken(jwt);
      if (validationResult.valid && validationResult.user) {
        return {
          userId: validationResult.user.id,
          user: validationResult.user,
        };
      }
      return null;
    } catch (error) {
      this.logger.error('JWT validation failed:', error);
      return null;
    }
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
      const authResult = await this.validateJWT(payload.jwt);
      if (!authResult) {
        return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Invalid JWT' });
      }

      const socketToken = this.generateSocketToken();
      this.socketTokens.set(socketToken, {
        userId: authResult.userId,
        createdAt: Date.now(),
      });

      this.connectedClients.set(client.id, {
        userId: authResult.userId,
        socketToken,
        socket: client,
      });

      return this.createResponse(client.id, true, {
        token: socketToken,
        userId: authResult.userId,
        user: authResult.user,
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
        userId: guestId,
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

  @SubscribeMessage(PortalUserActions.SELECT_ENTITY)
  async handleSelectEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SelectEntityRequest
  ): Promise<any> {
    try {
      // Validate payload
      const validation = SelectEntityRequestSchema.safeParse(payload);
      if (!validation.success) {
        console.log("Validation failed:", validation.error.issues);
        return this.createResponse(client.id, false, {
          type: 'validation-error', 
          message: 'Invalid payload format',
          details: validation.error.issues 
        });
      }

      console.log("Entity selected by user:", payload.userId, "with UID:", payload.uid);
      // const clientData = this.connectedClients.get(client.id);
      // if (!clientData) {
      //   return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
      // }

      // TODO: Forward to Aperture service via WebSocket
      // For now, return success and broadcast event
      const environmentId = payload.environmentId || '1';

      const result = await this.apertureClient.selectEntity(payload.userId, environmentId, payload.uid);
      // Broadcast entity selected event to environment
      // this.broadcastToEnvironment(environmentId, {
      //   id: 'system',
      //   type: 'portal:entitySelected',
      //   payload: {
      //     type: 'aperture.entity/selected',
      //     entity_uid: payload.uid,
      //     userId: payload.userId,
      //     environment_id: environmentId,
      //   },
      // });

      console.log("Entity selected:", payload.uid, "by user:", payload.userId);

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
    @MessageBody() payload: { userId: string }
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
          userId: payload.userId,
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

  @SubscribeMessage(PortalUserActions.LOAD_SPECIALIZATION_HIERARCHY)
  async handleLoadSpecializationHierarchy(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LoadSpecializationHierarchyRequest
  ): Promise<any> {
    try {
      // Validate payload
      const validation = LoadSpecializationHierarchyRequestSchema.safeParse(payload);
      console.log("All related facts loaded for UID:", payload.uid, "by user:", payload.userId);
      console.log(validation)
      if (!validation.success) {
        console.log(validation.error.issues)
        return this.createResponse(client.id, false, { 
          type: 'validation-error', 
          message: 'Invalid payload format',
          details: validation.error.issues 
        });
      }

      const result = await this.apertureClient.loadSpecializationHierarchy(payload.uid.toString(), ""+payload.userId);

      if (!result ) {
        return {
          success: false,
          error: {
            type: 'internal-error',
            message: 'Failed to load specialization hierarchy',
            details: result ? result.error : 'Unknown error',
          },
        };
      }

      return result;
    } catch (error) {
      this.logger.error('Load specialization hierarchy error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to load specialization hierarchy' });
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ENTITY)
  async handleLoadEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Entity loaded',
      });
    } catch (error) {
      this.logger.error('Load entity error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to load entity' });
    }
  }

  @SubscribeMessage(PortalUserActions.CLEAR_ENTITIES)
  async handleClearEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {

      // Validate payload
      const validation = ClearEntitiesRequestSchema.safeParse(payload);
      if (!validation.success) {
        console.log("Validation failed:", validation.error.issues);
        return this.createResponse(client.id, false, { 
          type: 'validation-error', 
          message: 'Invalid payload format',
          details: validation.error.issues 
        });
      }

      // const clientData = this.connectedClients.get(client.id);
      // if (!clientData) {
      //   return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
      // }

      const userId = payload.userId;// || clientData.userId;
      const environmentId = payload.environmentId || '1'; // Default to environment 1 if not provided

      // Call Aperture service to clear environment entities
      const result = await this.apertureClient.clearEnvironmentEntities(""+userId, ""+environmentId);

      if (!result) {
        return this.createResponse(client.id, false, { 
          type: 'internal-error', 
          message: 'Failed to clear entities',
          details: 'No response from Aperture service'
        });
      }

      return this.createResponse(client.id, true, {
        message: 'Entities cleared',
        data: {
          ...result,
          clearedFactCount: result.factUids ? result.factUids.length : 0,
        },
      });
    } catch (error) {
      this.logger.error('Clear entities error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to clear entities' });
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ALL_RELATED_FACTS)
  async handleLoadAllRelatedFacts(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'All related facts loaded',
        facts: [],
      });
    } catch (error) {
      this.logger.error('Load all related facts error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to load all related facts' });
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_SUBTYPES_CONE)
  async handleLoadSubtypesCone(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Subtypes cone loaded',
      });
    } catch (error) {
      this.logger.error('Load subtypes cone error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to load subtypes cone' });
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_ENTITY)
  async handleUnloadEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Entity unloaded',
      });
    } catch (error) {
      this.logger.error('Unload entity error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to unload entity' });
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_SUBTYPES_CONE)
  async handleUnloadSubtypesCone(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Subtypes cone unloaded',
      });
    } catch (error) {
      this.logger.error('Unload subtypes cone error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to unload subtypes cone' });
    }
  }

  @SubscribeMessage(PortalUserActions.DELETE_ENTITY)
  async handleDeleteEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Entity deleted',
      });
    } catch (error) {
      this.logger.error('Delete entity error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to delete entity' });
    }
  }

  @SubscribeMessage(PortalUserActions.DELETE_FACT)
  async handleDeleteFact(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Fact deleted',
      });
    } catch (error) {
      this.logger.error('Delete fact error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to delete fact' });
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ENTITIES)
  async handleLoadEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Entities loaded',
      });
    } catch (error) {
      this.logger.error('Load entities error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to load entities' });
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_ENTITIES)
  async handleUnloadEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Entities unloaded',
      });
    } catch (error) {
      this.logger.error('Unload entities error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to unload entities' });
    }
  }

  @SubscribeMessage(PortalUserActions.GET_SPECIALIZATION_HIERARCHY)
  async handleGetSpecializationHierarchy(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any
  ): Promise<any> {
    try {
      // TODO: Implement Aperture service call
      return this.createResponse(client.id, true, {
        message: 'Specialization hierarchy retrieved',
        hierarchy: [],
      });
    } catch (error) {
      this.logger.error('Get specialization hierarchy error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to get specialization hierarchy' });
    }
  }


  @SubscribeMessage('chatUserInput')
  async handleChatUserInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { message: string; userId: string }
  ): Promise<any> {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
      }

      // Get environment context for the user
      const environmentId = clientData.environmentId || '1';
      
      // Process chat input through NOUS
      const result = await this.nousClient.processChatInput(
        payload.message,
        payload.userId || clientData.userId,
        {
          environmentId,
          timestamp: Date.now(),
        }
      );

      // Broadcast AI response to environment
      this.broadcastToEnvironment(environmentId, {
        id: 'system',
        type: 'portal:aiResponse',
        payload: {
          type: 'nous.chat/response',
          message: result.response,
          userId: payload.userId || clientData.userId,
          environment_id: environmentId,
          metadata: result.metadata,
        },
      });

      return this.createResponse(client.id, true, {
        message: 'Chat input processed',
        response: result.response,
        metadata: result.metadata,
      });
    } catch (error) {
      this.logger.error('Chat input error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to process chat input' });
    }
  }

  @SubscribeMessage('generateAIResponse')
  async handleGenerateAIResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { prompt: string; context?: any }
  ): Promise<any> {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
      }

      // Generate AI response through NOUS
      const result = await this.nousClient.generateResponse(
        payload.prompt,
        {
          ...payload.context,
          userId: clientData.userId,
          environmentId: clientData.environmentId || '1',
        }
      );

      return this.createResponse(client.id, true, {
        response: result.response,
        metadata: result.metadata,
      });
    } catch (error) {
      this.logger.error('Generate AI response error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to generate AI response' });
    }
  }

  @SubscribeMessage('clearChatHistory')
  async handleClearChatHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId?: string }
  ): Promise<any> {
    try {
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        return this.createResponse(client.id, false, { type: 'unauthorized', message: 'Not authenticated' });
      }

      // TODO: Implement chat history clearing when NOUS supports it
      return this.createResponse(client.id, true, {
        message: 'Chat history cleared',
      });
    } catch (error) {
      this.logger.error('Clear chat history error:', error);
      return this.createResponse(client.id, false, { type: 'internal-error', message: 'Failed to clear chat history' });
    }
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
  // @SubscribeMessage('*')
  // handleUnknownMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any): any {
  //   this.logger.warn(`Unknown message type received from ${client.id}:`, data);
  //   return this.createResponse(client.id, false, {
  //     type: 'unknown-message-type',
  //     message: `Unknown message type`,
  //   });
  // }
}
