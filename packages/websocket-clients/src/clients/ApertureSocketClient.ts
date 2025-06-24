import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BaseWebSocketClient } from "./PortalSocketClient";
import { ApertureActions, ApertureEvents } from "@relica/websocket-contracts";

@Injectable()
export class ApertureSocketClient extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, "aperture", 3003);
  }

  protected setupServiceSpecificEventHandlers(): void {
    if (!this.socket) return;

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

  // =====================================================
  // ENVIRONMENT OPERATIONS
  // =====================================================

  async getEnvironment(userId: string, environmentId?: string): Promise<any> {
    const payload = { userId, environmentId };
    return this.sendRequestMessage(ApertureActions.ENVIRONMENT_GET, payload);
  }

  async listEnvironments(userId: string): Promise<any> {
    const payload = { userId };
    return this.sendRequestMessage(ApertureActions.ENVIRONMENT_LIST, payload);
  }

  async createEnvironment(userId: string, name: string): Promise<any> {
    const payload = { userId, name };
    return this.sendRequestMessage(ApertureActions.ENVIRONMENT_CREATE, payload);
  }

  async clearEnvironment(userId: string, environmentId: string): Promise<any> {
    const payload = { userId, environmentId };
    return this.sendRequestMessage(ApertureActions.ENVIRONMENT_CLEAR, payload);
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
    return this.sendRequestMessage(ApertureActions.SELECT_ENTITY, payload);
  }

  async deselectEntity(userId: string, environmentId: string): Promise<any> {
    const payload = { userId, environmentId };
    return this.sendRequestMessage(ApertureActions.ENTITY_DESELECT, payload);
  }

  async loadEntity(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(ApertureActions.ENTITY_LOAD, payload);
  }

  async unloadEntity(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(ApertureActions.ENTITY_UNLOAD, payload);
  }

  async loadMultipleEntities(
    userId: number,
    uids: number[],
    environmentId: string
  ): Promise<any> {
    const payload = {
      userId,
      uids,
      environmentId,
    };
    return this.sendRequestMessage(
      ApertureActions.ENTITY_LOAD_MULTIPLE,
      payload
    );
  }

  async unloadMultipleEntities(
    userId: number,
    uids: number[],
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUids: uids,
      environmentId,
    };
    return this.sendRequestMessage(
      ApertureActions.ENTITY_UNLOAD_MULTIPLE,
      payload
    );
  }

  // =====================================================
  // SEARCH OPERATIONS
  // =====================================================

  async searchLoadText(userId: number, term: string): Promise<any> {
    const payload = { userId, term };
    return this.sendRequestMessage(ApertureActions.SEARCH_LOAD_TEXT, payload);
  }

  async searchLoadUid(userId: number, uid: number): Promise<any> {
    const payload = { userId, uid };
    return this.sendRequestMessage(ApertureActions.SEARCH_LOAD_UID, payload);
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
    return this.sendRequestMessage(
      ApertureActions.SPECIALIZATION_LOAD,
      payload
    );
  }

  async loadSpecializationFact(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      uid,
      environmentId,
    };
    return this.sendRequestMessage(
      ApertureActions.SPECIALIZATION_LOAD_FACT,
      payload
    );
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
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(ApertureActions.SUBTYPE_LOAD, payload);
  }

  async loadSubtypesCone(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(ApertureActions.SUBTYPE_LOAD_CONE, payload);
  }

  async unloadSubtypesCone(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(
      ApertureActions.SUBTYPE_UNLOAD_CONE,
      payload
    );
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
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(
      ApertureActions.CLASSIFICATION_LOAD,
      payload
    );
  }

  async loadClassificationFact(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(
      ApertureActions.CLASSIFICATION_LOAD_FACT,
      payload
    );
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
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(ApertureActions.COMPOSITION_LOAD, payload);
  }

  async loadCompositionIn(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(
      ApertureActions.COMPOSITION_LOAD_IN,
      payload
    );
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
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(ApertureActions.CONNECTION_LOAD, payload);
  }

  async loadConnectionsIn(
    userId: number,
    uid: number,
    environmentId?: number
  ): Promise<any> {
    const payload = {
      userId,
      entityUid: uid,
      environmentId,
    };
    return this.sendRequestMessage(ApertureActions.CONNECTION_LOAD_IN, payload);
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
      userId,
      uid,
      environmentId,
    };
    return this.sendRequestMessage(
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
      userId,
      uid,
      environmentId,
    };
    return this.sendRequestMessage(
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
    return this.sendRequestMessage(
      ApertureActions.LOAD_ALL_RELATED_FACTS,
      payload
    );
  }

  // =====================================================
  // BATCH ENTITY OPERATIONS
  // =====================================================

  async loadEntities(
    userId: number,
    uids: number[],
    environmentId: string
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

  // Connection utilities inherited from BaseWebSocketClient
}
