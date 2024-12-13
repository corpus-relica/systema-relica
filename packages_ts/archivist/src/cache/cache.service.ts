import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Fact } from '@relica/types';

import { linearize } from 'c3-linearization';
import { LinearizationService } from 'src/linearization/linearization.service';

@Injectable()
export class CacheService {
  /* to be clear this is a cache-cache. It is merely the portion of
   * the descendants cache that we have touched since the app started.
   */
  descendantsCache = null;
  entityPromptCache = null;

  constructor(
    @InjectRedis() private readonly redisClient: Redis,
    private readonly linearizationService: LinearizationService,
  ) {
    this.descendantsCache = {};
    this.entityPromptCache = {};
  }

  //----------------------------------------------------------------------- FACTS

  async updateFactsInvolvingEntity(uid) {
    // const result = await execQuery(allFactsInvolvingEntity, { uid });
    // if (result.length === 0) return [];
    // const facts = result.map((item) => {
    //     return convertNeo4jInts(item.toObject().r).properties;
    // });
    // const factsKey = `rlc:db:YYYY:entity:${uid}:facts`;
    // const uidsToAdd = [];
    // for (let i = 0; i < facts.length; i++) {
    //     const factUIDstr = facts[i].fact_uid + '';
    //     const isMember = await client.SISMEMBER(factsKey, factUIDstr);
    //     uidsToAdd.push(factUIDstr);
    // }
    // if (uidsToAdd.length > 0) {
    //     await client.SADD(factsKey, uidsToAdd);
    // }
  }

  async removeFromFactsInvolvingEntity(uid, factUID) {
    const factsKey = `rlc:db:YYYY:entity:${uid}:facts`;
    await this.redisClient.srem(factsKey, factUID + '');
  }

  async allFactsInvolvingEntity(uid) {
    const factsKey = `rlc:db:YYYY:entity:${uid}:facts`;
    let facts: any[] = await this.redisClient.smembers(factsKey);
    facts = facts.map((fact) => parseInt(fact, 10));
    if (facts && facts.length > 0) {
      return facts;
    }
    return [];
  }

  //----------------------------------------------------------------- DESCENDANTS

  async updateDescendantsInDB(nodeToDescendants: any) {
    for (const [nodeUid, descendantsSet] of nodeToDescendants.entries()) {
      try {
        const newDescendants = Array.from(descendantsSet).map((uid) =>
          (uid as number).toString(),
        );
        const ns = 'rlc:db:YYYY:entity:' + nodeUid + ':descendants';
        // client.SADD(ns, newDescendants);
        for (const descendant of newDescendants) {
          const isMember = await this.redisClient.sismember(ns, descendant);
          if (isMember === 0) {
            this.redisClient.sadd(ns, descendant);
          } else {
            console.log('already exists');
          }
        }
      } catch (error) {
        console.error(
          `updateDescendantsInDB:Failed to update descendants for node ${nodeUid}:`,
          error,
        );
      }
    }
  }

  async allDescendantsOf(uid: number): Promise<number[]> {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    let descendants: any[] = await this.redisClient.smembers(descendantsKey);
    // Convert each member of the set from a string to an integer
    descendants = descendants.map((descendant: string) =>
      parseInt(descendant, 10),
    );

    if (descendants && descendants.length > 0) {
      //     this.descendantsCache[uid] = descendants;
      return descendants;
    }

    return [];
  }

  async updateDescendantsCache(uid) {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    let descendants: any[] = await this.redisClient.smembers(descendantsKey);
    descendants = descendants.map((descendant) => parseInt(descendant, 10));
    this.descendantsCache[uid] = descendants;
    return descendants;
  }

  // async setDescendantsOf(uid, descendants) {
  //   const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
  //   await this.redisClient.SADD(descendantsKey, descendants);
  //   this.descendantsCache[uid] = descendants;
  //   return descendants;
  // }

  clearDescendants() {
    this.descendantsCache = {};
  }

  async addDescendantTo(uid, descendant) {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    await this.redisClient.sadd(descendantsKey, descendant + '');
    // console.log(uid, descendant, Object.keys(this.descendantsCache));//.includes(parseInt(uid)));
    if (this.descendantsCache[uid + '']) {
      console.log('Adding descendant to cache');
      this.descendantsCache[uid + ''] = [
        ...this.descendantsCache[uid + ''],
        descendant,
      ];
    }
  }

  async addDescendantsTo(uid, descendants: number[]) {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    await this.redisClient.sadd(
      descendantsKey,
      ...descendants.map((d) => d + ''),
    );
    if (this.descendantsCache[uid + '']) {
      console.log('Adding descendants to cache', uid);
      this.descendantsCache[uid + ''] = [
        ...this.descendantsCache[uid + ''],
        ...descendants,
      ];
    }
  }

  async removeDescendantFrom(uid, descendant) {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    await this.redisClient.srem(descendantsKey, descendant + '');
    if (this.descendantsCache[uid + '']) {
      console.log('Removing descendant from cache');
      this.descendantsCache[uid + ''] = this.descendantsCache[uid + ''].filter(
        (d) => d !== descendant,
      );
    }
  }

  async removeDescendantsFrom(uid, descendants: number[]) {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    await this.redisClient.srem(
      descendantsKey,
      ...descendants.map((d) => d + ''),
    );
    if (this.descendantsCache[uid + '']) {
      console.log('Removing descendants from cache');
      this.descendantsCache[uid + ''] = this.descendantsCache[uid + ''].filter(
        (d) => !descendants.includes(d),
      );
    }
  }

  //--------------------------------------------------------------------- LINEAGE

  async lineageOf(uid: number) {
    try {
      const lineageKey = `rlc:db:YYYY:entity:${uid}:lineage`;
      let lineage: any[] = await this.redisClient.lrange(lineageKey, 0, -1);
      lineage = lineage.map((uid) => parseInt(uid, 10));
      return lineage;
    } catch (e) {
      console.log(e);

      return [];
    }
  }

  async promptOf(uid) {
    //   if (this.entityPromptCache[uid]) {
    //     return this.entityPromptCache[uid];
    //   }
    //   const promptKey = `rlc:db:YYYY:entity:${uid}:prompts:info`;
    //   let prompt /*string*/ = await this.redisClient.GET(promptKey);
    //   if (prompt) {
    //     this.entityPromptCache[uid] = prompt;
    //     return prompt;
    //   }
    //   return null;
  }

  async setPromptOf(uid, prompt) {
    //   const promptKey = `rlc:db:YYYY:${uid}:prompts:info`;
    //   await this.redisClient.set(promptKey, prompt);
    //   this.entityPromptCache[uid] = prompt;
    //   return prompt;
  }

  async clearEntityLineageCache(uid) {
    const lineageKey = `rlc:db:YYYY:entity:${uid}:lineage`;
    await this.redisClient.del(lineageKey);
  }

  async clearEntityLineageCacheComplete() {
    let cursor = 0;

    do {
      // console.log('cursor', cursor);

      try {
        const reply = await this.redisClient.scan(
          cursor,
          'MATCH',
          'rlc:db:YYYY:entity:*:lineage',
          'COUNT',
          '100',
        );

        cursor = parseInt(reply[0]);
        const keys = reply[1];

        if (keys.length === 0) {
          console.log('No matching keys found.');
        } else {
          console.log('deleting keys:', keys);
          await this.redisClient.del(keys);
        }
      } catch (error) {
        console.error('Error occurred during Redis scan:', error);
        break; // Exit the loop if an error occurs
      }
    } while (cursor !== 0);
  }

  async addToEntityLineageCache(entityUid: number, lineage: number[]) {
    // console.log('addToEntityLineageCache', entityUid, lineage);
    try {
      const ns = 'rlc:db:YYYY:entity:' + entityUid + ':lineage';
      const lineageStrArray = lineage.map((uid) => uid.toString());
      console.log('lineageStrArray', lineageStrArray);
      if (lineageStrArray.length === 0) {
        throw new Error(
          'Lineage is empty for entity ' +
            entityUid +
            '. Does it have a supertype?',
        );
      }
      await this.redisClient.lpush(ns, ...lineageStrArray);
      return;
    } catch (error) {
      console.error(
        `addToEntityLineageCache:Failed to update lineage for entity ${entityUid}:`,
        error,
      );
      console.log(entityUid, lineage);
    }
  }

  //--------------------------------------------------------------------- ENTITY

  async getMinFreeEntityUID() {
    const minFreeEntityUIDKey = `rlc:db:YYYY:minFreeEntityUID`;
    const minFreeEntityUID = await this.redisClient.get(minFreeEntityUIDKey);
    if (minFreeEntityUID) {
      return +minFreeEntityUID;
    }
    return 0;
  }

  async setMinFreeEntityUID(uid: number) {
    const minFreeEntityUIDKey = `rlc:db:YYYY:minFreeEntityUID`;
    await this.redisClient.set(minFreeEntityUIDKey, '' + uid);
  }

  async getMinFreeFactUID() {
    const minFreeFactUIDKey = `rlc:db:YYYY:minFreeFactUID`;
    const minFreeFactUID = await this.redisClient.get(minFreeFactUIDKey);
    if (minFreeFactUID) {
      return +minFreeFactUID;
    }
    return 0;
  }

  async setMinFreeFactUID(uid: number) {
    const minFreeFactUIDKey = `rlc:db:YYYY:minFreeFactUID`;
    await this.redisClient.set(minFreeFactUIDKey, '' + uid);
  }

  //------------------------------------------------------------- RELATED FACTS

  async clearEntityFactsCacheComplete() {
    let cursor = 0; // Start with cursor as a number

    do {
      // Correct call format with cursor as a number and options as the second argument
      const reply = await this.redisClient.scan(
        cursor,
        'MATCH',
        'rlc:db:YYYY:entity:*:facts',
        'COUNT',
        '100',
      );

      cursor = parseInt(reply[0]); // Assuming cursor should be a number according to the error messages

      const keys = reply[1];

      if (keys.length) {
        await this.redisClient.del(keys);
      }
    } while (cursor !== 0); // Repeat until SCAN has iterated through the entire keyspace, checking cursor as a number
  }

  addToEntityFactsCache = async (entityUid: number, factUid: number) => {
    try {
      const ns = 'rlc:db:YYYY:entity:' + entityUid + ':facts';
      const factUidStr = factUid + '';
      const isMember = await this.redisClient.sismember(ns, factUidStr);
      if (isMember === 0) {
        await this.redisClient.sadd(ns, factUidStr);
      } else {
        // console.log('already exists');
      }
    } catch (error) {
      console.error(
        `addToEntityFactsCache:Failed to update facts for entity ${entityUid}:`,
        error,
      );
    }
  };

  removeEntityFromLineageDescendants = async (euid: number, luid: number) => {
    console.log('REMLD');
    const lineage = await this.lineageOf(luid);
    const descendants = await this.allDescendantsOf(euid);
    await Promise.all(
      lineage.map(async (ancestorUID, idx) => {
        if (idx < lineage.length - 1) {
          await this.removeDescendantsFrom(ancestorUID, [...descendants, euid]);
        }
      }),
    );
    console.log('REMLD COMPLETE');
  };

  appendFact = async (fact: Fact) => {
    if (fact.rel_type_uid === 1146 || fact.rel_type_uid === 1726) {
      const lineage = await this.linearizationService.calculateLineage(
        fact.lh_object_uid,
      );
      const descendants = await this.allDescendantsOf(fact.lh_object_uid);
      // add lh_object_uid to each subtypes-cache on the lineage
      // not including the fact itself
      for (let i = 1; i < lineage.length; i++) {
        console.log('ADDING DESCENDANTS TO', i, lineage.length, lineage[i]);
        await this.addDescendantsTo(lineage[i], [
          ...descendants,
          fact.lh_object_uid,
        ]);
      }
      await this.addToEntityLineageCache(fact.lh_object_uid, lineage);
      await Promise.all(
        descendants.map(async (descendant) => {
          const lineage =
            await this.linearizationService.calculateLineage(descendant);
          await this.addToEntityLineageCache(descendant, lineage);
        }),
      );
    }
    // add to facts cache regardless
    await this.addToEntityFactsCache(fact.lh_object_uid, fact.fact_uid);
    await this.addToEntityFactsCache(fact.rh_object_uid, fact.fact_uid);
  };

  //TODO: figure out if this should be recursive
  // i.e. from a UX perspective, should deleting an entity delete all of its descendants?
  removeEntity = async (uid: number) => {
    // get lineage
    const lineage = await this.lineageOf(uid);
    const supertype = lineage[1];
    // iterate the lineage of the entity and remove the entity from each
    // of the descendants caches
    this.removeEntityFromLineageDescendants(uid, supertype);

    // remove from descendants cache
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    await this.redisClient.del(descendantsKey);

    // remove from lineage cache
    const lineageKey = `rlc:db:YYYY:entity:${uid}:lineage`;
    await this.redisClient.del(lineageKey);

    // remove from facts cache
    const factsKey = `rlc:db:YYYY:entity:${uid}:facts`;
    await this.redisClient.del(factsKey);

    // remove from prompt cache
    const promptKey = `rlc:db:YYYY:${uid}:prompts:info`;
    await this.redisClient.del(promptKey);
  };
}
