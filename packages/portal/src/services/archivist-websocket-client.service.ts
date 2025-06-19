import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
import { ArchivistMessage, ServiceResponse } from '../types/websocket-messages';
import { KindActions, EntityActions } from '@relica/websocket-contracts';

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
      action: KindActions.LIST, // 'kinds:list'
      payload: {},
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get kinds');
    }
    return response.data;
  }

  async getKindsList(sortField: string = 'lh_object_name', sortOrder: string = 'ASC', skip: number = 0, pageSize: number = 10, filters: any = {}): Promise<any> {
    const message = {
      id: this.generateMessageId(),
      type: 'request' as const,
      service: 'archivist' as const,
      action: KindActions.LIST, // 'kinds:list'
      payload: {
        filters: {
          sort: [sortField, sortOrder],
          range: [skip, pageSize],
          filter: filters
        }
      },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get kinds list');
    }
    return response.data;
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
    return response.data;
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
    return response.data;
  }

  async resolveUIDs(uids: number[]): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: EntityActions.BATCH_RESOLVE, // 'entity:batch-resolve'
      payload: { uids },
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to resolve UIDs');
    }
    return response.data;
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
    return response.data;
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
    return response.data;
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
    return response.data;
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
    return response.data;
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
    return response.data;
  }

  async getEntityCollections(): Promise<any> {
    const message: ArchivistMessage = {
      id: this.generateMessageId(),
      type: 'request',
      service: 'archivist',
      action: EntityActions.COLLECTIONS_GET, // 'entity:collections-get'
      payload: {},
    };

    const response = await this.sendMessage(message);
    if (!response.success) {
      throw new Error(response.error || 'Failed to get entity collections');
    }
    return response.data;
  }

}
