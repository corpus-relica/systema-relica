import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { ApertureMessage, ServiceResponse } from '../types/websocket-messages';

@Injectable()
export class ApertureWebSocketClientService extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'aperture', 3003);
  }

  async getEnvironment(userId: number, environmentId: number = undefined): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: 'get-environment',
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
      action: 'create-environment',
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

  async selectEntity(uid: string, userId: string, environmentId?: string): Promise<any> {
    const message: ApertureMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'aperture',
      action: 'select-entity',
      payload: { uid, userId, environmentId },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to select entity');
    }
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
      action: 'load-specialization-hierarchy',
      payload: { uid, userId },
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
      action: 'clear-environment-entities',
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
