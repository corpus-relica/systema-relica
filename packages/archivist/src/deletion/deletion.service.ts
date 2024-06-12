import { Injectable } from '@nestjs/common';
import {
  allFactsInvolvingEntity,
  deleteFactQuery,
  deleteEntityQuery,
} from 'src/graph/queries';
import { GraphService } from 'src/graph/graph.service';
import { CacheService } from 'src/cache/cache.service';
import { GellishBaseService } from 'src/gellish-base/gellish-base.service';

@Injectable()
export class DeletionService {
  constructor(
    private readonly graphService: GraphService,
    private readonly cacheService: CacheService,
    private readonly gellishBaseService: GellishBaseService,
  ) {}

  async deleteEntity(uid) {
    // TODO: remove entity from cache if is kind

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

    // await Promise.all(
    //   factUIDs.map(async (fact_uid) => {
    //     await execQuery(deleteFactQuery, { uid: fact_uid });
    //   }),
    // );

    // // delete all the facts
    await this.graphService.execWriteQuery(deleteEntityQuery, { uid });

    return { result: 'success', uid: uid, deletedFacts: facts };
    // return { result: "testing" };
  }

  async deleteFact(uid) {
    const fact = await this.gellishBaseService.getFact(uid);
    const { fact_uid, lh_object_uid, rh_object_uid } = fact;

    const lhFactUIDs =
      await this.cacheService.allFactsInvolvingEntity(lh_object_uid);
    const rhFactUIDs =
      await this.cacheService.allFactsInvolvingEntity(rh_object_uid);

    await this.cacheService.removeFromFactsInvolvingEntity(
      lh_object_uid,
      fact_uid,
    );
    await this.cacheService.removeFromFactsInvolvingEntity(
      rh_object_uid,
      fact_uid,
    );
    await this.graphService.execWriteQuery(deleteFactQuery, {
      uid: fact_uid,
    });

    // remove orphans
    if (lhFactUIDs.length === 1 && lhFactUIDs[0] === uid) {
      await this.deleteEntity(lh_object_uid);
    }
    if (rhFactUIDs.length === 1 && rhFactUIDs[0] === uid) {
      await this.deleteEntity(rh_object_uid);
    }

    return { result: 'success', uid: uid, deletedFact: fact };
  }
}
