import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { ArchivistMessage, ServiceResponse } from '../types/websocket-messages';

@Injectable()
export class ArchivistWebSocketClientService extends BaseWebSocketClient {
  constructor(configService: ConfigService) {
    super(configService, 'archivist', 3000);
  }

  async getKinds(): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'get-kinds',
      payload: {},
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get kinds');
    }
    return response.payload;
  }

  async searchText(query: string, limit?: number, offset?: number): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'search-text',
      payload: { query, limit, offset },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to search text');
    }
    return response.payload;
  }

  async searchUid(uid: string): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'search-uid',
      payload: { uid },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to search UID');
    }
    return response.payload;
  }

  async resolveUids(uids: string[]): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'resolve-uids',
      payload: { uids },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to resolve UIDs');
    }
    return response.payload;
  }

  async getClassified(uid: string): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'get-classified',
      payload: { uid },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get classified');
    }
    return response.payload;
  }

  async getSubtypes(uid: string): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'get-subtypes',
      payload: { uid },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get subtypes');
    }
    return response.payload;
  }

  async getSubtypesCone(uid: string): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'get-subtypes-cone',
      payload: { uid },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get subtypes cone');
    }
    return response.payload;
  }

  async submitFact(factData: any): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'submit-fact',
      payload: factData,
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to submit fact');
    }
    return response.payload;
  }

  async deleteFact(factId: string): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: 'delete-fact',
      payload: { factId },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to delete fact');
    }
    return response.payload;
  }

}