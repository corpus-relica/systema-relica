import { Injectable } from '@nestjs/common';
import { deleteFactQuery, deleteEntityQuery } from 'src/graph/queries';
import { GraphService } from 'src/graph/graph.service';
import { CacheService } from 'src/cache/cache.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';

@Injectable()
export class ConceptService {
  constructor(
    private readonly graphService: GraphService,
    private readonly cacheService: CacheService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  async deleteEntity(uid) {
    // to delete an entity we need to delete all the facts involving the entity
    const factUIDs = await this.cacheService.allFactsInvolvingEntity(uid);
    const facts = await Promise.all(
      factUIDs.map(async (factUID) => {
        return await this.gellishBaseService.getFact(factUID);
      }),
    );
    console.log('FACT UIDS', factUIDs);
    await Promise.all(
      facts.map(async (fact) => {
        console.log('FACT', fact);
        await this.cacheService.removeFromFactsInvolvingEntity(
          fact.lh_object_uid,
          fact.fact_uid,
        );
        await this.cacheService.removeFromFactsInvolvingEntity(
          fact.rh_object_uid,
          fact.fact_uid,
        );
        await this.graphService.execWriteQuery(deleteFactQuery, {
          uid: fact.fact_uid,
        });
      }),
    );

    await this.cacheService.removeEntity(uid);

    // delete all the facts
    await this.graphService.execWriteQuery(deleteEntityQuery, { uid });

    return { result: 'success', uid: uid, deletedFacts: facts };
  }
}
