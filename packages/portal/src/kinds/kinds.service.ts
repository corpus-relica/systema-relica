import { Injectable } from '@nestjs/common';
import { ArchivistSocketClient } from '@relica/websocket-clients';

@Injectable()
export class KindsService {
  constructor(private readonly archivistClient: ArchivistSocketClient) {}

  async getKindsList(
    sortField: string,
    sortOrder: string,
    skip: number,
    pageSize: number,
    filterParams: any
  ) {
    return this.archivistClient.getKindsList(
      sortField,
      sortOrder,
      skip,
      pageSize,
      filterParams
    );
  }
}