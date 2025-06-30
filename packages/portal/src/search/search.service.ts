import { Injectable, Logger } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';
import { decodePayload } from '@relica/websocket-contracts';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async searchText(
    searchTerm: string,
    collectionUID?: number,
    limit?: number,
    offset?: number,
    filter?: string
  ) {
    try {
      const binaryResponse = await this.archivistClient.searchText(searchTerm, collectionUID, limit, offset, filter);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to search text for term '${searchTerm}':`, error);
      throw error;
    }
  }

  async searchUid(uid: string) {
    try {
      const binaryResponse = await this.archivistClient.searchUid(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to search for UID '${uid}':`, error);
      throw error;
    }
  }
}