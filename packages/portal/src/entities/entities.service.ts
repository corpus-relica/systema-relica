import { Injectable, Logger } from "@nestjs/common";
import { ArchivistSocketClient } from "@relica/websocket-clients";

@Injectable()
export class EntitiesService {
  private readonly logger = new Logger(EntitiesService.name);

  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async resolveUIDs(uids: number[]) {
    try {
      return await this.archivistClient.resolveUIDs(uids);
    } catch (error) {
      this.logger.error(`Failed to resolve UIDs ${uids.join(", ")}:`, error);
      throw error;
    }
  }

  async getEntityType(uid: number) {
    try {
      return await this.archivistClient.getEntityType(uid);
    } catch (error) {
      this.logger.error(`Failed to get entity type for uid ${uid}:`, error);
      throw error;
    }
  }

  async getEntityCategory(uid: number) {
    try {
      return await this.archivistClient.getEntityCategory(uid);
    } catch (error) {
      this.logger.error(`Failed to get entity category for uid ${uid}:`, error);
      throw error;
    }
  }

  async getEntityCollections() {
    try {
      return await this.archivistClient.getEntityCollections();
    } catch (error) {
      this.logger.error("Failed to get entity collections:", error);
      throw error;
    }
  }
}
