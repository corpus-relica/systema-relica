import { Injectable } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Injectable()
export class EntitiesService {
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async resolveUIDs(uids: number[]) {
    return this.archivistClient.resolveUIDs(uids);
  }

  async getEntityType(uid: number) {
    return this.archivistClient.getEntityType(uid);
  }

  async getEntityCategory(uid: number) {
    return this.archivistClient.getEntityCategory(uid);
  }

  async getEntityCollections() {
    return this.archivistClient.getEntityCollections();
  }
}