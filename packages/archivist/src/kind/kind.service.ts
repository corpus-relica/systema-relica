import neo4j from 'neo4j-driver';

import { Injectable, Logger } from '@nestjs/common';

import { GraphService } from 'src/graph/graph.service';

import { reparentKindQuery } from 'src/graph/queries';

@Injectable()
export class KindService {
  private readonly logger = new Logger(KindService.name);

  constructor(private readonly graphService: GraphService) {}

  async reparentKind(
    uid: number,
    newParentUID: number,
    partialDefinition: string,
    fullDefinition: string,
  ) {
    const result = await this.graphService.execWriteQuery(reparentKindQuery, {
      uid,
      newParentUID,
      partialDefinition,
      fullDefinition,
      latestUpdate: new Date().toISOString().split('T')[0],
    });

    if (result.length === 0) {
      return [];
    }

    // TODO: Important!!! update caches!!!

    return result.map((r) => this.graphService.transformResult(r));
  }
}
