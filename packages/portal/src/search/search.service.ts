import { Injectable, Logger } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

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
      return await this.archivistClient.searchText(searchTerm, collectionUID, limit, offset, filter);
    } catch (error) {
      this.logger.error(`Failed to search text for term '${searchTerm}':`, error);
      throw error;
    }
  }

  async searchUid(uid: string) {
    try {
      return await this.archivistClient.searchUid(uid);
    } catch (error) {
      this.logger.error(`Failed to search for UID '${uid}':`, error);
      throw error;
    }
  }
}