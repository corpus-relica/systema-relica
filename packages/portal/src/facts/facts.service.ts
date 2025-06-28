import { Injectable } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Injectable()
export class FactsService {
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async getClassified(uid: number) {
    return this.archivistClient.getClassified(uid);
  }

  async getSubtypes(uid: number) {
    return this.archivistClient.getSubtypes(uid);
  }

  async getSubtypesCone(uid: number) {
    return this.archivistClient.getSubtypesCone(uid);
  }
}