import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ApertureSocketClient } from "@relica/websocket-clients";
import {
  ApertureEvents,
  PortalSystemEvents,
  decodePayload,
} from "@relica/websocket-contracts";

@Injectable()
export class ApertureWebSocketClientService implements OnModuleInit {
  private readonly logger = new Logger(ApertureWebSocketClientService.name);
  private portalGateway: any; // Will be injected after initialization to avoid circular dependency

  constructor(private readonly apertureClient: ApertureSocketClient) {}

  async onModuleInit() {
    // Set up event forwarding from Aperture to Portal
    this.apertureClient.on(ApertureEvents.LOADED_FACTS, (payload) => {
      this.logger.debug(`Received aperture.facts/loaded event`);
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Decode binary broadcast event before forwarding to frontend clients
      const decodedPayload = decodePayload(payload);
      this.portalGateway.server.emit(PortalSystemEvents.LOADED_FACTS, decodedPayload.data);
    });

    this.apertureClient.on(ApertureEvents.UNLOADED_FACTS, (payload) => {
      this.logger.debug(`Received aperture.facts/unloaded event`);
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Decode binary broadcast event before forwarding to frontend clients
      const decodedPayload = decodePayload(payload);
      this.portalGateway.server.emit(
        PortalSystemEvents.UNLOADED_FACTS,
        decodedPayload.data
      );
    });

    this.apertureClient.on(ApertureEvents.ENTITY_SELECTED, (payload) => {
      this.logger.debug(`Received entity selected event`, payload);
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Decode binary broadcast event before forwarding to frontend clients
      const decodedPayload = decodePayload(payload);
      this.portalGateway.server.emit(
        PortalSystemEvents.SELECTED_ENTITY,
        decodedPayload.data
      );
    });

    this.apertureClient.on(ApertureEvents.ENTITY_DESELECTED, (payload) => {
      this.logger.debug(`Received entity deselected event`);
      if (!this.portalGateway) {
        this.logger.warn("PortalGateway not set, cannot forward event");
        return;
      }
      // Decode binary broadcast event before forwarding to frontend clients
      const decodedPayload = decodePayload(payload);
      this.portalGateway.server.emit(PortalSystemEvents.SELECTED_NONE, decodedPayload.data);
    });
  }

  setPortalGateway(gateway: any) {
    this.portalGateway = gateway;
  }

  // private setupBroadcastListener() {
  //   if (!this.socket || !this.portalGateway) return;

  //   // Listen for setup status broadcasts from Prism
  //   this.socket.on(PrismEvents.SETUP_STATUS_UPDATE, (broadcastEvent: SetupStatusBroadcastEvent) => {
  //     this.logger.log('📡 Received setup status broadcast from Prism, forwarding to frontend clients');

  //     // Forward the broadcast to all connected frontend clients via Portal Gateway
  //     this.portalGateway.server.emit(PrismEvents.SETUP_STATUS_UPDATE, broadcastEvent);
  //   });
  // }

  // Delegate all methods to the shared ApertureSocketClient
  async getEnvironment(
    userId: number,
    environmentId: number = undefined
  ): Promise<any> {
    const result = await this.apertureClient.getEnvironment(
      userId.toString(),
      environmentId?.toString()
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to get environment");
    }
    return result.data || result;
  }

  async createEnvironment(environmentData: any): Promise<any> {
    const result = await this.apertureClient.createEnvironment(
      environmentData.userId,
      environmentData.name
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to create environment");
    }
    return result.data || result;
  }

  async updateEnvironment(
    environmentId: string,
    environmentData: any
  ): Promise<any> {
    const result = await this.apertureClient.updateEnvironment(
      environmentData.userId,
      environmentId,
      environmentData
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to update environment");
    }
    return result.data || result;
  }

  async selectEntity(
    userId: number,
    environmentId: string = "1",
    uid: number
  ): Promise<any> {
    console.log("SELECTING ENTITY", { userId, environmentId, uid });
    const result = await this.apertureClient.selectEntity(
      userId.toString(),
      environmentId,
      uid.toString()
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to select entity");
    }
    console.log("APERTURE SELECT ENTITY RESPONSE", result);
    return result.data || result;
  }

  async selectNone(userId: number, environmentId: string = "1"): Promise<any> {
    const result = await this.apertureClient.deselectEntity(
      userId.toString(),
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to deselect entities");
    }
    return result.data || result;
  }

  async loadEntities(environmentId: string, filters?: any): Promise<any> {
    // For now, we'll need to pass the UIDs array and userId from the filters
    // This assumes filters contains { uids: number[], userId: number }
    if (!filters || !filters.uids || !filters.userId) {
      throw new Error(
        "loadEntities requires filters with uids array and userId"
      );
    }
    const result = await this.apertureClient.loadEntities(
      filters.userId,
      filters.uids,
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to load entities");
    }
    return result.data || result;
  }

  async loadSpecializationHierarchy(uid: string, userId: string): Promise<any> {
    const result = await this.apertureClient.loadSpecializationHierarchy(
      Number(userId),
      Number(uid)
    );
    if (!result.success && result.error) {
      throw new Error(
        result.error.message || "Failed to load specialization hierarchy"
      );
    }
    return result.data || result;
  }

  async clearEnvironmentEntities(
    userId: string,
    environmentId?: string
  ): Promise<any> {
    const result = await this.apertureClient.clearEnvironment(
      userId,
      environmentId || "1"
    );
    if (!result.success && result.error) {
      throw new Error(
        result.error.message || "Failed to clear environment entities"
      );
    }
    return result.data || result;
  }

  async loadAllRelatedFacts(
    userId: number,
    environmentId: string,
    uid: number
  ): Promise<any> {
    const result = await this.apertureClient.loadAllRelatedFacts(
      Number(userId),
      environmentId,
      Number(uid)
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to load related facts");
    }
    return result.data || result;
  }

  async loadEntity(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const result = await this.apertureClient.loadEntity(
      userId,
      uid,
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to load entity");
    }
    return result.data || result;
  }

  async unloadEntity(
    userId: number,
    uid: number,
    environmentId?: string
  ): Promise<any> {
    const result = await this.apertureClient.unloadEntity(
      userId,
      uid,
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to unload entity");
    }
    return result.data || result;
  }

  async loadSubtypesCone(
    userId: number,
    uid: number,
    environmentId: string
  ): Promise<any> {
    const result = await this.apertureClient.loadSubtypesCone(
      userId,
      uid,
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to load subtypes cone");
    }
    return result.data || result;
  }

  async unloadSubtypesCone(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const result = await this.apertureClient.unloadSubtypesCone(
      userId,
      uid,
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(result.error.message || "Failed to unload subtypes cone");
    }
    return result.data || result;
  }

  async loadMultipleEntities(
    userId: number,
    uids: number[],
    environmentId?: string
  ): Promise<any> {
    const result = await this.apertureClient.loadMultipleEntities(
      userId,
      uids,
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(
        result.error.message || "Failed to load multiple entities"
      );
    }
    return result.data || result;
  }

  async unloadMultipleEntities(
    userId: number,
    uids: number[],
    environmentId?: number
  ): Promise<any> {
    const result = await this.apertureClient.unloadMultipleEntities(
      userId,
      uids,
      environmentId
    );
    if (!result.success && result.error) {
      throw new Error(
        result.error.message || "Failed to unload multiple entities"
      );
    }
    return result.data || result;
  }
}
