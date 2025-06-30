import { Injectable, Logger } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';
import { decodePayload } from '@relica/websocket-contracts';

@Injectable()
export class FactsService {
  private readonly logger = new Logger(FactsService.name);
  
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async getClassified(uid: number) {
    try {
      const binaryResponse = await this.archivistClient.getClassified(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get classified facts for uid ${uid}:`, error);
      throw error;
    }
  }

  async getSubtypes(uid: number) {
    try {
      const binaryResponse = await this.archivistClient.getSubtypes(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get subtypes for uid ${uid}:`, error);
      throw error;
    }
  }

  async getSubtypesCone(uid: number) {
    try {
      const binaryResponse = await this.archivistClient.getSubtypesCone(uid);
      return decodePayload(binaryResponse);
    } catch (error) {
      this.logger.error(`Failed to get subtypes cone for uid ${uid}:`, error);
      throw error;
    }
  }
}