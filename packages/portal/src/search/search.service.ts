import { Injectable } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Injectable()
export class SearchService {
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async searchText(
    searchTerm: string,
    collectionUID?: number,
    limit?: number,
    offset?: number,
    filter?: string
  ) {
    return this.archivistClient.searchText(searchTerm, collectionUID, limit, offset, filter);
  }

  async searchUid(uid: string) {
    return this.archivistClient.searchUid(uid);
  }
}