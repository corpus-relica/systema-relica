import neo4j from 'neo4j-driver';

import { Injectable, Logger } from '@nestjs/common';

import { GraphService } from 'src/graph/graph.service';
import { Fact } from '@relica/types';

// import { reparentKindQuery } from 'src/graph/queries';

@Injectable()
export class QueryService {
  private readonly logger = new Logger(QueryService.name);

  constructor(private readonly graphService: GraphService) {}

  async handleGellishQuery(queryTable: Fact[]) {
    console.log('handleGellishQuery', queryTable);
    const { lh_object_uid, rel_type_uid, rh_object_uid } = queryTable[0];

    console.log('lh_object_uid', lh_object_uid);
    console.log('rel_type_uid', rel_type_uid);
    console.log('rh_object_uid', rh_object_uid);

    // const result = await this.graphService.execWriteQuery(reparentKindQuery, {
    //   uid,
    //   newParentUID,
    //   partialDefinition,
    //   fullDefinition,
    //   latestUpdate: new Date().toISOString().split('T')[0],
    // });
    // if (result.length === 0) {
    //   return [];
    // }
    // // TODO: Important!!! update caches!!!
    // return result.map((r) => this.graphService.transformResult(r));
  }
}
