import neo4j from 'neo4j-driver';

import { Injectable, Logger } from '@nestjs/common';

import { GraphService } from '../graph/graph.service.js';
import { CacheService } from '../cache/cache.service.js';
import { LinearizationService } from '../linearization/linearization.service.js';
import { UIDService } from '../uid/uid.service.js';
import { GellishBaseService } from '../gellish-base/gellish-base.service.js';

import {
  reparentKindQuery,
  createFact,
  removeSupertypeQuery,
} from '../graph/queries.js';
import { Fact } from '@relica/types';

@Injectable()
export class KindService {
  private readonly logger = new Logger(KindService.name);

  constructor(
    private readonly graphService: GraphService,
    private readonly linService: LinearizationService,
    private readonly cacheService: CacheService,
    private readonly uidService: UIDService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  async addSupertype(
    uid: number,
    name: string,
    newSupertypeUid: number,
    partialDefinition: string,
    fullDefinition: string,
  ) {
    const supertype = (
      await this.gellishBaseService.getSpecializationFact(newSupertypeUid)
    )[0];

    const fact: Fact = {
      fact_uid: this.uidService.reserveUID()[0],
      lh_object_uid: parseInt('' + uid),
      lh_object_name: name,
      rh_object_uid: parseInt('' + newSupertypeUid),
      rh_object_name: supertype.lh_object_name,
      rel_type_uid: 1146,
      rel_type_name: 'is a specialization of',
      partial_definition: partialDefinition,
      full_definition: fullDefinition,
      latest_update: new Date().toISOString().split('T')[0],
    };

    const result = await this.graphService.execWriteQuery(createFact, {
      lh_object_uid: uid,
      rh_object_uid: newSupertypeUid,
      properties: fact,
    });

    if (result.length === 0) {
      return [];
    }

    // update caches
    this.cacheService.appendFact(fact);
  }

  async removeSupertype(uid: number, supertypeUid: number) {
    const spupertypes =
      await this.gellishBaseService.getSpecializationFact(uid);
    const supertype = spupertypes.find(
      (s: Fact) => s.rh_object_uid === supertypeUid,
    );
    console.log('supertype: ', supertype);
    console.log(uid, supertypeUid);

    const result = await this.graphService.execWriteQuery(
      removeSupertypeQuery,
      {
        uid,
        supertypeUid,
      },
    );
    if (result.length === 0) {
      return [];
    }

    // update caches
    const lineage = await this.linService.calculateLineage(uid);
    const descendants = await this.cacheService.allDescendantsOf(uid);

    if (lineage.length === 0) {
      // clear the lineage of this and each descendant
      await this.cacheService.clearEntityLineageCache(uid);
      await Promise.all(
        descendants.map(async (descendant) => {
          await this.cacheService.clearEntityLineageCache(descendant);
        }),
      );
    } else {
      // recalculate the lineage of this and each descendant
      await this.cacheService.addToEntityLineageCache(uid, lineage);
      await Promise.all(
        descendants.map(async (descendant) => {
          const lineage = await this.linService.calculateLineage(descendant);
          await this.cacheService.addToEntityLineageCache(descendant, lineage);
        }),
      );
    }

    //
    // remove descendant uids from each ancestor on lineage
    await this.cacheService.removeEntityFromLineageDescendants(
      uid,
      supertypeUid,
    );

    // remove from facts cache of two involved entities
    await this.cacheService.removeFromFactsInvolvingEntity(
      supertype.lh_object_uid,
      supertype.fact_uid,
    );
    await this.cacheService.removeFromFactsInvolvingEntity(
      supertype.rh_object_uid,
      supertype.fact_uid,
    );
  }

  async addParentToKind(
    uid: number,
    name: string,
    newParentUID: number,
    partialDefinition: string,
    fullDefinition: string,
  ) {
    await this.addSupertype(
      uid,
      name,
      newParentUID,
      partialDefinition,
      fullDefinition,
    );
  }

  async reparentKind(
    uid: number,
    name: string,
    newParentUID: number,
    partialDefinition: string,
    fullDefinition: string,
  ) {
    const specFact = (
      await this.gellishBaseService.getSpecializationFact(uid)
    )[0];

    await this.removeSupertype(uid, specFact.rh_object_uid);

    await this.addSupertype(
      uid,
      name,
      newParentUID,
      partialDefinition,
      fullDefinition,
    );
  }
}
