import { Injectable, Logger } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Injectable()
export class FactsService {
  private readonly logger = new Logger(FactsService.name);
  
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async getClassified(uid: number) {
    try {
      return await this.archivistClient.getClassified(uid);
    } catch (error) {
      this.logger.error(`Failed to get classified facts for uid ${uid}:`, error);
      throw error;
    }
  }

  async getSubtypes(uid: number) {
    try {
      return await this.archivistClient.getSubtypes(uid);
    } catch (error) {
      this.logger.error(`Failed to get subtypes for uid ${uid}:`, error);
      throw error;
    }
  }

  async getSubtypesCone(uid: number) {
    try {
      return await this.archivistClient.getSubtypesCone(uid);
    } catch (error) {
      this.logger.error(`Failed to get subtypes cone for uid ${uid}:`, error);
      throw error;
    }
  }
}