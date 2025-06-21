import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { io, Socket } from "socket.io-client";
import customParser from "socket.io-msgpack-parser";
import { ApertureActions, ApertureEvents } from "@relica/websocket-contracts";

@Injectable()
export class ApertureSocketClient implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;
  private readonly logger = new Logger(ApertureSocketClient.name);
  private readonly pendingRequests = new Map<
    string,
    { resolve: Function; reject: Function }
  >();
  private messageCounter = 0;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Try to connect but don't fail startup if services aren't ready
    this.connect().catch((err) => {
      this.logger.warn(
        `Could not connect to aperture on startup: ${err.message}`
      );
      this.logger.warn(`Will retry when first request is made`);
    });
  }

  async onModuleDestroy() {
    this.disconnect();
  }

  private async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const host = this.configService.get<string>("APERTURE_HOST", "localhost");
    const port = this.configService.get<number>("APERTURE_PORT", 3007);
    const url = `ws://${host}:${port}`;

    this.socket = io(url, {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // parser: customParser, // Use msgpack parser for better performance
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Failed to connect to aperture service"));
      }, 5000);

      this.socket!.on("connect", () => {
        clearTimeout(timeout);
        this.logger.log(`Connected to aperture service at ${url}`);
        resolve();
      });

      this.socket!.on("connect_error", (error) => {
        clearTimeout(timeout);
        this.logger.error("Failed to connect to aperture service:", error);
        reject(error);
      });

      this.socket!.connect();
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.logger.log("Disconnected from aperture service");
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("disconnect", () => {
      this.logger.warn("Disconnected from aperture service");
    });

    this.socket.on("reconnect", () => {
      this.logger.log("Reconnected to aperture service");
    });

    this.socket.on("error", (error) => {
      this.logger.error("Aperture service error:", error);
    });

    // Forward Aperture events to registered handlers
    this.socket.on(ApertureEvents.LOADED_FACTS, (payload) => {
      this.emitToHandlers(ApertureEvents.LOADED_FACTS, payload);
    });

    this.socket.on(ApertureEvents.UNLOADED_FACTS, (payload) => {
      this.emitToHandlers(ApertureEvents.UNLOADED_FACTS, payload);
    });

    this.socket.on(ApertureEvents.ENTITY_SELECTED, (payload) => {
      this.emitToHandlers(ApertureEvents.ENTITY_SELECTED, payload);
    });

    this.socket.on(ApertureEvents.ENTITY_DESELECTED, (payload) => {
      this.emitToHandlers(ApertureEvents.ENTITY_DESELECTED, payload);
    });
  }

  private generateMessageId(): string {
    return crypto.randomUUID();
  }

  private async sendMessage(action: string, payload: any): Promise<any> {
    if (!this.socket?.connected) {
      this.logger.log("Not connected to aperture, attempting to connect...");
      try {
        await this.connect();
      } catch (error) {
        throw new Error(
          `Failed to connect to aperture service: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Create proper request message structure per WebSocket contracts
    const message = {
      id: this.generateMessageId(),
      type: "request" as const,
      service: "aperture",
      action,
      payload,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Request timeout for aperture service"));
      }, 30000);

      this.socket!.emit(action, message, (response: any) => {
        clearTimeout(timeout);

        if (response && response.success === false) {
          reject(new Error(response.error || "Request failed"));
        } else {
          resolve(response);
        }
      });
    });
  }

  // Event handling methods
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emitToHandlers(event: string, payload: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(payload);
        } catch (error) {
          this.logger.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // =====================================================
  // ENVIRONMENT OPERATIONS
  // =====================================================

  async getEnvironment(userId: string, environmentId?: string): Promise<any> {
    const payload = { userId, environmentId };
    return this.sendMessage(ApertureActions.ENVIRONMENT_GET, payload);
  }

  async listEnvironments(userId: string): Promise<any> {
    const payload = { userId };
    return this.sendMessage(ApertureActions.ENVIRONMENT_LIST, payload);
  }

  async createEnvironment(userId: string, name: string): Promise<any> {
    const payload = { userId, name };
    return this.sendMessage(ApertureActions.ENVIRONMENT_CREATE, payload);
  }

  async clearEnvironment(userId: string, environmentId: string): Promise<any> {
    const payload = { userId, environmentId };
    return this.sendMessage(ApertureActions.ENVIRONMENT_CLEAR, payload);
  }

  // =====================================================
  // ENTITY OPERATIONS
  // =====================================================

  async selectEntity(
    userId: string,
    environmentId: string,
    uid: string
  ): Promise<any> {
    const payload = { userId, environmentId, uid };
    return this.sendMessage(ApertureActions.SELECT_ENTITY, payload);
  }

  async deselectEntity(userId: string, environmentId: string): Promise<any> {
    const payload = { userId, environmentId };
    return this.sendMessage(ApertureActions.ENTITY_DESELECT, payload);
  }

  async loadEntity(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.ENTITY_LOAD, payload);
  }

  async unloadEntity(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.ENTITY_UNLOAD, payload);
  }

  async loadMultipleEntities(
    userId: number,
    uids: number[],
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uids": uids,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.ENTITY_LOAD_MULTIPLE, payload);
  }

  async unloadMultipleEntities(
    userId: number,
    uids: number[],
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uids": uids,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.ENTITY_UNLOAD_MULTIPLE, payload);
  }

  // =====================================================
  // SEARCH OPERATIONS
  // =====================================================

  async searchLoadText(userId: number, term: string): Promise<any> {
    const payload = { "user-id": userId, term };
    return this.sendMessage(ApertureActions.SEARCH_LOAD_TEXT, payload);
  }

  async searchLoadUid(userId: number, uid: number): Promise<any> {
    const payload = { "user-id": userId, uid };
    return this.sendMessage(ApertureActions.SEARCH_LOAD_UID, payload);
  }

  // =====================================================
  // SPECIALIZATION OPERATIONS
  // =====================================================

  async loadSpecializationHierarchy(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      uid,
      environmentId,
    };
    return this.sendMessage(ApertureActions.SPECIALIZATION_LOAD, payload);
  }

  async loadSpecializationFact(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.SPECIALIZATION_LOAD_FACT, payload);
  }

  // =====================================================
  // SUBTYPE OPERATIONS
  // =====================================================

  async loadSubtypes(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.SUBTYPE_LOAD, payload);
  }

  async loadSubtypesCone(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.SUBTYPE_LOAD_CONE, payload);
  }

  async unloadSubtypesCone(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.SUBTYPE_UNLOAD_CONE, payload);
  }

  // =====================================================
  // CLASSIFICATION OPERATIONS
  // =====================================================

  async loadClassified(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.CLASSIFICATION_LOAD, payload);
  }

  async loadClassificationFact(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.CLASSIFICATION_LOAD_FACT, payload);
  }

  // =====================================================
  // COMPOSITION OPERATIONS
  // =====================================================

  async loadComposition(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.COMPOSITION_LOAD, payload);
  }

  async loadCompositionIn(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.COMPOSITION_LOAD_IN, payload);
  }

  // =====================================================
  // CONNECTION OPERATIONS
  // =====================================================

  async loadConnections(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.CONNECTION_LOAD, payload);
  }

  async loadConnectionsIn(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      "entity-uid": uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(ApertureActions.CONNECTION_LOAD_IN, payload);
  }

  // =====================================================
  // RELATION OPERATIONS
  // =====================================================

  async loadRequiredRoles(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(
      ApertureActions.RELATION_REQUIRED_ROLES_LOAD,
      payload
    );
  }

  async loadRolePlayers(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      "user-id": userId,
      uid,
      "environment-id": environmentId,
    };
    return this.sendMessage(
      ApertureActions.RELATION_ROLE_PLAYERS_LOAD,
      payload
    );
  }

  // =====================================================
  // FACT OPERATIONS
  // =====================================================

  async loadAllRelatedFacts(
    userId: number,
    environmentId: string,
    uid: number
  ): Promise<any> {
    const payload = {
      userId,
      uid,
      environmentId,
    };
    console.log("ApertureSocketClient.loadAllRelatedFacts payload", payload);
    return this.sendMessage(ApertureActions.LOAD_ALL_RELATED_FACTS, payload);
  }

  // =====================================================
  // BATCH ENTITY OPERATIONS
  // =====================================================

  async loadEntities(
    userId: number,
    uids: number[],
    environmentId?: number
  ): Promise<any> {
    // Use the existing loadMultipleEntities method which handles the same functionality
    return this.loadMultipleEntities(userId, uids, environmentId);
  }

  // =====================================================
  // ENVIRONMENT MANAGEMENT
  // =====================================================

  async updateEnvironment(
    userId: number,
    environmentId: string,
    updateData: any
  ): Promise<any> {
    // For now, there's no specific UPDATE action in the contracts
    // This could be implemented as a combination of other operations
    // or a new action could be added to the contracts
    throw new Error(
      "updateEnvironment not yet available in Aperture contracts"
    );
  }

  // =====================================================
  // CONNECTION UTILITIES
  // =====================================================

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }
}
