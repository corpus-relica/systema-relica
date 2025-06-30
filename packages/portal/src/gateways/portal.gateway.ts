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
import { ShutterRestClientService } from "../shared/services/shutter-rest-client.service";
import { ApertureWebSocketClientService } from "../shared/services/aperture-websocket-client.service";
import { NousWebSocketClientService } from "../shared/services/nous-websocket-client.service";
import { PrismWebSocketClientService } from "../shared/services/prism-websocket-client.service";
import { ArchivistSocketClient } from "@relica/websocket-clients";
import {
  ServiceMessage,
  ServiceResponse,
  ClientMessage,
  ClientResponse,
  ClientEvent,
} from "../shared/types/websocket-messages";
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
  createTargetedPortalBroadcast,
} from "@relica/websocket-contracts";

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
    private readonly prismClient: PrismWebSocketClientService,
    private readonly archivistClient: ArchivistSocketClient
  ) {
    // Set up the broadcast forwarding after initialization
    this.prismClient.setPortalGateway(this);
    this.apertureClient.setPortalGateway(this);
    this.nousClient.setPortalGateway(this);
  }

  // Binary serialization methods are now provided by shared utilities

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
    const targetClients = [];
    for (const [clientId, clientData] of this.connectedClients) {
      if (clientData.environmentId === environmentId) {
        targetClients.push(clientData.socket);
      }
    }
    createTargetedPortalBroadcast(targetClients, "message", message);
  }

  @SubscribeMessage("auth")
  async handleAuth(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawMessage: any
  ): Promise<any> {
    try {
      const message = rawMessage;
      const { jwt } = message.payload;
      const authResult = await this.validateJWT(jwt);
      if (!authResult) {
        const error = new Error("Invalid JWT");
        this.logger.error("Auth validation failed", error);
        return {
          error: error.message,
          id: message.id,
          success: false,
          timestamp: Date.now()
        };
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
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Auth error:", error);
      return {
        error: error.message,
        id: rawMessage.id || 'unknown',
        success: false,
        timestamp: Date.now()
      };
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
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Guest auth error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Ping failed", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.SELECT_ENTITY)
  async handleSelectEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawMessage: any
  ): Promise<any> {
    try {
      const message = rawMessage;
      const payload = message.payload;
      // Validate payload
      const validation = SelectEntityRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Select entity validation failed", error);
        return {
          error: error.message,
          id: message.id,
          success: false,
          timestamp: Date.now()
        };
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
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Select entity error:", error);
      return {
        error: error.message,
        id: rawMessage.id || 'unknown',
        success: false,
        timestamp: Date.now()
      };
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

      const data = { message: "Entity deselected" };
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Select none error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_SPECIALIZATION_HIERARCHY)
  async handleLoadSpecializationHierarchy(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      console.log("LOAD SH", message);
      const payload = message.payload;
      // Validate payload
      const validation =
        LoadSpecializationHierarchyRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error(
          "Load specialization hierarchy validation failed",
          error
        );
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const result = await this.apertureClient.loadSpecializationHierarchy(
        payload.uid.toString(),
        "" + payload.userId
      );

      if (!result) {
        const error = new Error("Failed to load specialization hierarchy");
        this.logger.error("Load specialization hierarchy failed", error);
        return {
          error: error.message,
          id: message.id,
          success: false,
          timestamp: Date.now()
        };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Load specialization hierarchy error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ENTITY)
  async handleLoadEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawMessage: any
  ): Promise<any> {
    try {
      const message = rawMessage;
      const payload = message.payload;
      // Validate payload
      const validation = LoadEntityRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Load entity validation failed", error);
        return {
          error: error.message,
          id: message.id,
          success: false,
          timestamp: Date.now()
        };
      }

      const userId = payload.userId;
      const environmentId = payload.environmentId || "1";
      const uid = payload.uid;

      // Call Aperture service to load entity
      const result = await this.apertureClient.loadEntity(
        Number(userId),
        Number(uid),
        Number(environmentId)
      );

      if (!result) {
        const error = new Error(
          "Failed to load entity - no response from Aperture service"
        );
        this.logger.error("Load entity failed", error);
        return {
          error: error.message,
          id: message.id,
          success: false,
          timestamp: Date.now()
        };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Load entity error:", error);
      return {
        error: error.message,
        id: rawMessage.id || 'unknown',
        success: false,
        timestamp: Date.now()
      };
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
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Clear entities validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
        const error = new Error(
          "Failed to clear entities - no response from Aperture service"
        );
        this.logger.error("Clear entities failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const data = {
        message: "Entities cleared",
        data: {
          ...result,
          clearedFactCount: result.factUids ? result.factUids.length : 0,
        },
      };
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Clear entities error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Load all related facts error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_SUBTYPES_CONE)
  async handleLoadSubtypesCone(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation = LoadSubtypesConeRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Load subtypes cone validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const userId = payload.userId;
      const environmentId = payload.environmentId || "1";
      const uid = payload.uid;

      // Call Aperture service to load subtypes cone
      const result = await this.apertureClient.loadSubtypesCone(
        userId,
        uid,
        environmentId
      );

      if (!result) {
        const error = new Error(
          "Failed to load subtypes cone - no response from Aperture service"
        );
        this.logger.error("Load subtypes cone failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Load subtypes cone error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_ENTITY)
  async handleUnloadEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation = UnloadEntityRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Unload entity validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const userId = payload.userId;
      const environmentId = payload.environmentId || "1";
      const uid = payload.uid;

      // Call Aperture service to unload entity
      const result = await this.apertureClient.unloadEntity(
        userId,
        uid,
        environmentId
      );

      if (!result) {
        const error = new Error(
          "Failed to unload entity - no response from Aperture service"
        );
        this.logger.error("Unload entity failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Unload entity error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_SUBTYPES_CONE)
  async handleUnloadSubtypesCone(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    console.log("payload", message);
    try {
      const payload = message.payload;
      // Validate payload
      const validation = UnloadSubtypesConeRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Unload subtypes cone validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const userId = payload.userId;
      const environmentId = payload.environmentId || "1";
      const uid = payload.uid;

      // Call Aperture service to unload subtypes cone
      const result = await this.apertureClient.unloadSubtypesCone(
        userId,
        uid,
        environmentId
      );

      if (!result) {
        const error = new Error(
          "Failed to unload subtypes cone - no response from Aperture service"
        );
        this.logger.error("Unload subtypes cone failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Unload subtypes cone error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.DELETE_ENTITY)
  async handleDeleteEntity(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation = DeleteEntityRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Delete entity validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const uid = payload.uid;

      // Call Archivist service to delete entity
      const result = await this.archivistClient.deleteEntity(Number(uid));

      if (!result) {
        const error = new Error(
          "Failed to delete entity - no response from Archivist service"
        );
        this.logger.error("Delete entity failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Delete entity error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.DELETE_FACT)
  async handleDeleteFact(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation = DeleteFactRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Delete fact validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const factUid = payload.factUid;

      // Call Archivist service to delete fact
      const result = await this.archivistClient.deleteFact(Number(factUid));

      if (!result) {
        const error = new Error(
          "Failed to delete fact - no response from Archivist service"
        );
        this.logger.error("Delete fact failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Delete fact error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.LOAD_ENTITIES)
  async handleLoadEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;

      // Validate payload
      const validation = LoadEntitiesRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Load entities validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const userId = payload.userId;
      const environmentId = payload.environmentId || "1";
      const uids = payload.uids;

      if (!Array.isArray(uids) || uids.length === 0) {
        const error = new Error("uids must be a non-empty array");
        this.logger.error("Load entities invalid uids", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      // Call Aperture service to load multiple entities
      const result = await this.apertureClient.loadMultipleEntities(
        userId,
        uids,
        environmentId
      );

      if (!result) {
        const error = new Error(
          "Failed to load entities - no response from Aperture service"
        );
        this.logger.error("Load entities failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Load entities error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.UNLOAD_ENTITIES)
  async handleUnloadEntities(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation = UnloadEntitiesRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error("Unload entities validation failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      const userId = payload.userId;
      const environmentId = payload.environmentId || "1";
      const uids = payload.uids;

      if (!Array.isArray(uids) || uids.length === 0) {
        const error = new Error("uids must be a non-empty array");
        this.logger.error("Unload entities invalid uids", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      // Call Aperture service to unload multiple entities
      const result = await this.apertureClient.unloadMultipleEntities(
        Number(userId),
        uids.map((uid) => Number(uid)),
        environmentId
      );
      if (!result) {
        const error = new Error(
          "Failed to unload entities - no response from Aperture service"
        );
        this.logger.error("Unload entities failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Unload entities error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.GET_SPECIALIZATION_HIERARCHY)
  async handleGetSpecializationHierarchy(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      const payload = message.payload;
      // Validate payload
      const validation =
        GetSpecializationHierarchyRequestSchema.safeParse(payload);
      if (!validation.success) {
        const error = new Error(
          `Invalid payload format: ${validation.error.issues.map((i) => i.message).join(", ")}`
        );
        this.logger.error(
          "Get specialization hierarchy validation failed",
          error
        );
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      // Call Aperture service to get specialization hierarchy
      const result = await this.apertureClient.loadSpecializationHierarchy(
        payload.uid.toString(),
        "" + payload.userId
      );

      if (!result) {
        const error = new Error("Failed to get specialization hierarchy");
        this.logger.error("Get specialization hierarchy failed", error);
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      return {
        data: result,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Get specialization hierarchy error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
    }
  }

  @SubscribeMessage(PortalUserActions.CHAT_USER_INPUT)
  async handleChatUserInput(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: any
  ): Promise<any> {
    try {
      console.log("CHAT INPUT", message);

      const payload = message.payload;
      const clientData = this.connectedClients.get(client.id);
      // if (!clientData) {
      //   const error = new Error("Not authenticated");
      //   this.logger.error("Chat input authentication failed", error);
      //   return toErrorResponse(error, message.id);
      // }

      // Get environment context for the user
      const environmentId = payload.environmentId || "1";

      // Process chat input through NOUS - this returns only receipt acknowledgment
      const result = await this.nousClient.processChatInput(
        payload.message,
        payload.userId,
        {
          environmentId,
          timestamp: Date.now(),
        }
      );

      console.log("CHAT INPUT RECEIPT", result);

      // Note: The actual AI response will come via event forwarding
      // from NousWebSocketClientService when the nous.chat/response event is received
      // No need to broadcast here - the event forwarding handles it automatically

      const data = {
        message: result.message,
        success: result.success,
        timestamp: result.timestamp,
      };
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Chat input error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Generate AI response error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
        return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
      }

      // TODO: Implement chat history clearing when NOUS supports it
      const data = { message: "Chat history cleared" };
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Clear chat history error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Prism start setup error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
      return {
        data,
        id: message.id,
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      this.logger.error("Prism create user error:", error);
      return {
        error: error.message,
        id: message.id,
        success: false,
        timestamp: Date.now()
      };
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
