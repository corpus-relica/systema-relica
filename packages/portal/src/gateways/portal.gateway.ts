import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from "@nestjs/websockets";
import { Logger, Injectable, Inject } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { ShutterRestClientService } from "../services/shutter-rest-client.service";
import { ApertureWebSocketClientService } from "../services/aperture-websocket-client.service";
import { NousWebSocketClientService } from "../services/nous-websocket-client.service";
import { PrismWebSocketClientService } from "../services/prism-websocket-client.service";
import {
  ServiceMessage,
  ServiceResponse,
  ClientMessage,
  ClientResponse,
  ClientEvent,
} from "../types/websocket-messages";
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
  toResponse,
  toErrorResponse,
} from "@relica/websocket-contracts";
import customParser from "socket.io-msgpack-parser";

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
  transports: ["websocket"],
  parser: customParser,
})
export class PortalGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PortalGateway.name);
  private connectedClients = new Map<string, ConnectedClient>();
  private socketTokens = new Map<
    string,
    { userId: string; createdAt: number; isGuest?: boolean }
  >();

  constructor(
    private readonly apertureClient: ApertureWebSocketClientService,
    private readonly shutterClient: ShutterRestClientService,
    private readonly nousClient: NousWebSocketClientService,
    private readonly prismClient: PrismWebSocketClientService
  ) {
    // Set up the broadcast forwarding after initialization
    this.prismClient.setPortalGateway(this);
    this.apertureClient.setPortalGateway(this);
  }


  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }


  private generateSocketToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateJWT(
    jwt: string
  ): Promise<{ userId: string; user: any } | null> {
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
      this.logger.error("JWT validation failed:", error);
      return null;
    }
  }

  private broadcastToEnvironment(environmentId: string, message: any) {
    for (const [clientId, clientData] of this.connectedClients) {
      if (clientData.environmentId === environmentId) {
        clientData.socket.emit("message", message);
      }
    }
  }

  @SubscribeMessage("auth")
  async handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const { jwt } = message.payload;
      const authResult = await this.validateJWT(jwt);
      if (!authResult) {
        const error = new Error("Invalid JWT");
        this.logger.error("Auth validation failed", error);
        return toErrorResponse(error, message.id);
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

      const data = {
        token: socketToken,
        userId: authResult.userId,
        user: authResult.user,
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Auth error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage("guest-auth")
  async handleGuestAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const socketToken = this.generateSocketToken();
      const guestId = "guest-user";

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

      const data = {
        token: socketToken,
        userId: guestId,
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Guest auth error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage("ping")
  async handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const data = {
        message: "Pong",
        timestamp: Date.now(),
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Ping failed", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.SELECT_ENTITY)
  async handleSelectEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation = SelectEntityRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(`Invalid payload format: ${validation.error.issues.map(i => i.message).join(', ')}`);
        this.logger.error("Select entity validation failed", error);
        return toErrorResponse(error, message.id);
      }

      // const clientData = this.connectedClients.get(client.id);
      // if (!clientData) {
      //   return toErrorResponse(new Error('Not authenticated'), message.id);
      // }

      const environmentId = payload.environmentId || "1";

      const result = await this.apertureClient.selectEntity(
        payload.userId,
        environmentId,
        payload.uid
      );
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

      const data = { message: "Entity selected" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Select entity error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.SELECT_NONE)
  async handleSelectNone(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // const clientData = this.connectedClients.get(client.id);
      // if (!clientData) {
      //   return toErrorResponse(new Error('Not authenticated'), message.id);
      // }

      const environmentId = payload.environmentId || "1";

      const result = await this.apertureClient.selectNone(
        payload.userId,
        "" + environmentId
      );
      // Broadcast entity deselected event to environment
      // this.broadcastToEnvironment(environmentId, {
      //   id: 'system',
      //   type: 'portal:entitySelectedNone',
      //   payload: {
      //     type: 'aperture.entity/deselected',
      //     userId: payload.userId,
      //     environment_id: environmentId,
      //   },
      // });

      const data = { message: 'Entity deselected' };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Select none error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_SPECIALIZATION_HIERARCHY)
  async handleLoadSpecializationHierarchy(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation =
        LoadSpecializationHierarchyRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(`Invalid payload format: ${validation.error.issues.map(i => i.message).join(', ')}`);
        this.logger.error("Load specialization hierarchy validation failed", error);
        return toErrorResponse(error, message.id);
      }

      const result = await this.apertureClient.loadSpecializationHierarchy(
        payload.uid.toString(),
        "" + payload.userId
      );

      if (!result) {
        const error = new Error("Failed to load specialization hierarchy");
        this.logger.error("Load specialization hierarchy failed", error);
        return toErrorResponse(error, message.id);
      }

      return toResponse(result, message.id);
    } catch (error) {
      this.logger.error("Load specialization hierarchy error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ENTITY)
  async handleLoadEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Entity loaded" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Load entity error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.CLEAR_ENTITIES)
  async handleClearEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation = ClearEntitiesRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(`Invalid payload format: ${validation.error.issues.map(i => i.message).join(', ')}`);
        this.logger.error("Clear entities validation failed", error);
        return toErrorResponse(error, message.id);
      }

      this.logger.log("CLEAR ENTITIES", payload);
      // const clientData = this.connectedClients.get(client.id);
      // if (!clientData) {
      //   return toErrorResponse(new Error('Not authenticated'), message.id);
      // }

      const userId = payload.userId; // || clientData.userId;
      const environmentId = payload.environmentId || "1"; // Default to environment 1 if not provided

      // Call Aperture service to clear environment entities
      const result = await this.apertureClient.clearEnvironmentEntities(
        "" + userId,
        "" + environmentId
      );

      if (!result) {
        const error = new Error("Failed to clear entities - no response from Aperture service");
        this.logger.error("Clear entities failed", error);
        return toErrorResponse(error, message.id);
      }

      const data = {
        message: "Entities cleared",
        data: {
          ...result,
          clearedFactCount: result.factUids ? result.factUids.length : 0,
        },
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Clear entities error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ALL_RELATED_FACTS)
  async handleLoadAllRelatedFacts(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      const result = await this.apertureClient.loadAllRelatedFacts(
        payload.userId,
        payload.environmentId,
        payload.uid
      );
      // TODO: Implement Aperture service call
      return toResponse(result, message.id);
    } catch (error) {
      this.logger.error("Load all related facts error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_SUBTYPES_CONE)
  async handleLoadSubtypesCone(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Subtypes cone loaded" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Load subtypes cone error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_ENTITY)
  async handleUnloadEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Entity unloaded" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Unload entity error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_SUBTYPES_CONE)
  async handleUnloadSubtypesCone(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Subtypes cone unloaded" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Unload subtypes cone error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.DELETE_ENTITY)
  async handleDeleteEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Entity deleted" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Delete entity error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.DELETE_FACT)
  async handleDeleteFact(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Fact deleted" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Delete fact error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ENTITIES)
  async handleLoadEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Entities loaded" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Load entities error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_ENTITIES)
  async handleUnloadEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = { message: "Entities unloaded" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Unload entities error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage(PortalUserActions.GET_SPECIALIZATION_HIERARCHY)
  async handleGetSpecializationHierarchy(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Aperture service call
      const data = {
        message: "Specialization hierarchy retrieved",
        hierarchy: [],
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Get specialization hierarchy error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage("chatUserInput")
  async handleChatUserInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        const error = new Error("Not authenticated");
        this.logger.error("Chat input authentication failed", error);
        return toErrorResponse(error, message.id);
      }

      // Get environment context for the user
      const environmentId = clientData.environmentId || "1";

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
        id: "system",
        type: "portal:aiResponse",
        payload: {
          type: "nous.chat/response",
          message: result.response,
          userId: payload.userId || clientData.userId,
          environment_id: environmentId,
          metadata: result.metadata,
        },
      });

      const data = {
        message: "Chat input processed",
        response: result.response,
        metadata: result.metadata,
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Chat input error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage("generateAIResponse")
  async handleGenerateAIResponse(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        const error = new Error("Not authenticated");
        this.logger.error("Generate AI response authentication failed", error);
        return toErrorResponse(error, message.id);
      }

      // Generate AI response through NOUS
      const result = await this.nousClient.generateResponse(payload.prompt, {
        ...payload.context,
        userId: clientData.userId,
        environmentId: clientData.environmentId || "1",
      });

      const data = {
        response: result.response,
        metadata: result.metadata,
      };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Generate AI response error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage("clearChatHistory")
  async handleClearChatHistory(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      const clientData = this.connectedClients.get(client.id);
      if (!clientData) {
        const error = new Error("Not authenticated");
        this.logger.error("Clear chat history authentication failed", error);
        return toErrorResponse(error, message.id);
      }

      // TODO: Implement chat history clearing when NOUS supports it
      const data = { message: "Chat history cleared" };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Clear chat history error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  // Prism setup handlers
  @SubscribeMessage("prism/startSetup")
  async handlePrismStartSetup(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      // TODO: Implement Prism service call
      const data = { result: {} };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Prism start setup error:", error);
      return toErrorResponse(error, message.id);
    }
  }

  @SubscribeMessage("prism/createUser")
  async handlePrismCreateUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // TODO: Implement Prism service call
      const data = { result: {} };
      return toResponse(data, message.id);
    } catch (error) {
      this.logger.error("Prism create user error:", error);
      return toErrorResponse(error, message.id);
    }
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
