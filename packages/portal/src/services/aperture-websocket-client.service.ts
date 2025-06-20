import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { ApertureMessage, ServiceResponse } from '../types/websocket-messages';
import { ApertureActions, ApertureEvents, PortalSystemEvents} from '@relica/websocket-contracts';
// import { PortalGateway } from '../gateways/portal.gateway';

@Injectable()
export class ApertureWebSocketClientService extends BaseWebSocketClient {
  private portalGateway: any; // Will be injected after initialization to avoid circular dependency

  constructor(configService: ConfigService) {
    super(configService, 'aperture', 3003);
  }

  async onModuleInit() {
    await super.onModuleInit();

    this.socket.on(ApertureEvents.LOADED_FACTS, (payload) => {
      this.logger.debug(`Received aperture.facts/loaded event`);
      if (!this.portalGateway) {
        this.logger.warn('PortalGateway not set, cannot forward event');
        return;
      }
      // Forward the event to the Portal Gateway
      this.portalGateway.server.emit(PortalSystemEvents.LOADED_FACTS, payload);
    });

    this.socket.on(ApertureEvents.UNLOADED_FACTS, (payload) => {
      this.logger.debug(`Received aperture.facts/unloaded event`);
      if (!this.portalGateway) {
        this.logger.warn('PortalGateway not set, cannot forward event');
        return;
      }
      // Forward the event to the Portal Gateway
      this.portalGateway.server.emit(PortalSystemEvents.UNLOADED_FACTS, payload);
    });

    this.socket.on(ApertureEvents.ENTITY_SELECTED, (payload) => {
      this.logger.debug(`Received entity selected event`, payload);
      if (!this.portalGateway) {
        this.logger.warn('PortalGateway not set, cannot forward event');
        return;
      }
      // // Forward the event to the Portal Gateway
      this.portalGateway.server.emit(PortalSystemEvents.SELECTED_ENTITY, payload);
    });

    this.socket.on(ApertureEvents.ENTITY_DESELECTED, (payload) => {
      this.logger.debug(`Received entity deselected event`);
      if (!this.portalGateway) {
        this.logger.warn('PortalGateway not set, cannot forward event');
        return;
      }
      // // Forward the event to the Portal Gateway
      this.portalGateway.server.emit(PortalSystemEvents.SELECTED_NONE, payload);
    });
  }

  setPortalGateway(gateway: any) {
    this.portalGateway = gateway;
    // this.setupBroadcastListener();
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

  async getEnvironment(userId: number, environmentId: number = undefined): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: ApertureActions.ENVIRONMENT_GET,
      payload: { userId, environmentId },
    };

    const response = await this.sendMessage(message);

    if (!response.success) {
      throw new Error(response.error || 'Failed to get environment');
    }
    return response.data;
  }

  async createEnvironment(environmentData: any): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: ApertureActions.ENVIRONMENT_CREATE,
      payload: environmentData,
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create environment');
    }
    return response.data;
  }

  async updateEnvironment(environmentId: string, environmentData: any): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: 'update-environment',
      payload: { environmentId, ...environmentData },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update environment');
    }
    return response.data;
  }

  async selectEntity(userId: number, environmentId: string = '1', uid: number): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: ApertureActions.SELECT_ENTITY,
      payload: { uid, userId, environmentId },
    };

    console.log('MUTHERFUCKING MESSAGE', message)
    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to select entity');
    }
    console.log('APERTURE SELECT ENTITY RESPONSE', response)
    return response.data;
  }

  async loadEntities(environmentId: string, filters?: any): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: 'load-entities',
      payload: { environmentId, filters },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to load entities');
    }
    return response.data;
  }

  async loadSpecializationHierarchy(uid: string, userId: string): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: ApertureActions.SPECIALIZATION_LOAD, // 'aperture.specialization/load'
      payload: { 
        uid: Number(uid), 
        'user-id': Number(userId), 
        'environment-id': undefined // optional per Clojure implementation
      },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to load specialization hierarchy');
    }
    return response.data;
  }

  async clearEnvironmentEntities(userId: string, environmentId?: string): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: ApertureActions.ENVIRONMENT_CLEAR, // 'aperture.environment/clear'
      payload: { userId, environmentId },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to clear environment entities');
    }
    return response.data;
  }

  async loadAllRelatedFacts(uid: string, userId: string): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: 'load-all-related-facts',
      payload: { uid, userId },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to load all related facts');
    }
    return response.data;
  }

}
