import { Injectable, Logger } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Injectable()
export class KindsService {
  private readonly logger = new Logger(KindsService.name);
  
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async getKindsList(
    sortField: string,
    sortOrder: string,
    skip: number,
    pageSize: number,
    filterParams: any
  ) {
    try {
      return await this.archivistClient.getKindsList(
        sortField,
        sortOrder,
        skip,
        pageSize,
        filterParams
      );
    } catch (error) {
      this.logger.error(`Failed to get kinds list:`, error);
      throw error;
    }
  }
}