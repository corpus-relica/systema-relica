import { Injectable, Logger } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';
import { decodePayload } from '@relica/websocket-contracts';

@Injectable()
export class EntitiesService {
  private readonly logger = new Logger(EntitiesService.name);
  
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async resolveUIDs(uids: number[]) {
    try {
      const binaryResponse = await this.archivistClient.resolveUIDs(uids);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to resolve UIDs ${uids.join(', ')}:`, error);
      throw error;
    }
  }

  async getEntityType(uid: number) {
    try {
      const binaryResponse = await this.archivistClient.getEntityType(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get entity type for uid ${uid}:`, error);
      throw error;
    }
  }

  async getEntityCategory(uid: number) {
    try {
      const binaryResponse = await this.archivistClient.getEntityCategory(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get entity category for uid ${uid}:`, error);
      throw error;
    }
  }

  async getEntityCollections() {
    try {
      const binaryResponse = await this.archivistClient.getEntityCollections();
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error('Failed to get entity collections:', error);
      throw error;
    }
  }
}