import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { ClarityMessage, ServiceResponse } from '../types/websocket-messages';

@Injectable()
export class ClarityWebSocketClientService extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'clarity', 3001);
  }

  async getModel(): Promise<any> {
    const message: ClarityMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'clarity',
      action: 'get-model',
      payload: {},
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get model');
    }
    return response.data;
  }

  async getKindModel(uid: string): Promise<any> {
    const message: ClarityMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'clarity',
      action: 'get-kind-model',
      payload: { uid },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get kind model');
    }
    return response.data;
  }

  async getIndividualModel(uid: string): Promise<any> {
    const message: ClarityMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'clarity',
      action: 'get-individual-model',
      payload: { uid },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get individual model');
    }
    return response.data;
  }

  async getEnvironment(environmentId: string): Promise<any> {
    const message: ClarityMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'clarity',
      action: 'get-environment',
      payload: { environmentId },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get environment');
    }
    return response.data;
  }

  async createModel(modelData: any): Promise<any> {
    const message: ClarityMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'clarity',
      action: 'create-model',
      payload: modelData,
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to create model');
    }
    return response.data;
  }

  async updateModel(modelId: string, modelData: any): Promise<any> {
    const message: ClarityMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'clarity',
      action: 'update-model',
      payload: { modelId, ...modelData },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to update model');
    }
    return response.data;
  }

}