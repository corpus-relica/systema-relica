import { execQuery } from "../services/queryService.js";
import { client } from "../services/redisService.js";
import { allFactsInvolvingEntity } from "../services/queries.js";
import { convertNeo4jInts } from "../services/neo4jService.js";

class Cache {
  /* to be clear this is a cache-cache. It is merely the portion of
   * the descendants cache that we have touched since the app started.
   */
  descendantsCache = null;
  entityPromptCache = null;

  constructor() {
    this.descendantsCache = {};
    this.entityPromptCache = {};
  }

  //----------------------------------------------------------------------- FACTS

  async updateFactsInvolvingEntity(uid) {
    const result = await execQuery(allFactsInvolvingEntity, { uid });
    if (result.length === 0) return [];
    const facts = result.map((item) => {
      return convertNeo4jInts(item.toObject().r).properties;
    });

    const factsKey = `rlc:db:YYYY:entity:${uid}:facts`;
    const uidsToAdd = [];
    for (let i = 0; i < facts.length; i++) {
      const factUIDstr = facts[i].fact_uid + "";
      const isMember = await client.SISMEMBER(factsKey, factUIDstr);
      uidsToAdd.push(factUIDstr);
    }
    if (uidsToAdd.length > 0) {
      await client.SADD(factsKey, uidsToAdd);
    }
  }

  async removeFromFactsInvolvingEntity(uid, factUID) {
    const factsKey = `rlc:db:YYYY:entity:${uid}:facts`;
    await client.SREM(factsKey, factUID + "");
  }

  async allFactsInvolvingEntity(uid) {
    const factsKey = `rlc:db:YYYY:entity:${uid}:facts`;
    let facts = await client.SMEMBERS(factsKey);
    facts = facts.map((fact) => parseInt(fact, 10));
    if (facts && facts.length > 0) {
      return facts;
    }
    return [];
  }

  //----------------------------------------------------------------- DESCENDANTS

  async allDescendantsOf(uid) {
    // return this.data[key];
    if (this.descendantsCache[uid]) {
      return this.descendantsCache[uid];
    }

    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    let descendants = await client.SMEMBERS(descendantsKey);
    // Convert each member of the set from a string to an integer
    descendants = descendants.map((descendant) => parseInt(descendant, 10));

    if (descendants && descendants.length > 0) {
      this.descendantsCache[uid] = descendants;
      return descendants;
    }

    return [];
  }

  async updateDescendantsCache(uid) {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    let descendants = await client.SMEMBERS(descendantsKey);
    descendants = descendants.map((descendant) => parseInt(descendant, 10));
    this.descendantsCache[uid] = descendants;
    return descendants;
  }

  // async setDescendantsOf(uid, descendants) {
  //   const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
  //   await client.SADD(descendantsKey, descendants);
  //   this.descendantsCache[uid] = descendants;
  //   return descendants;
  // }

  clearDescendants() {
    this.descendantsCache = {};
  }

  async addDescendantTo(uid, descendant) {
    const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
    await client.SADD(descendantsKey, descendant + "");
    // console.log(uid, descendant, Object.keys(this.descendantsCache));//.includes(parseInt(uid)));
    if (this.descendantsCache[uid + ""]) {
      console.log("Adding descendant to cache");
      this.descendantsCache[uid + ""] = [
        ...this.descendantsCache[uid],
        descendant,
      ];
    }
  }

  //--------------------------------------------------------------------- LINEAGE

  async lineageOf(uid) {
    try {
      const lineageKey = `rlc:db:YYYY:entity:${uid}:lineage`;
      let lineage = await client.LRANGE(lineageKey, 0, -1);
      lineage = lineage.map((uid) => parseInt(uid, 10));
      return lineage;
    } catch (e) {
      console.log(e);

      return [];
    }
  }

  // async promptOf(uid) {
  //   if (this.entityPromptCache[uid]) {
  //     return this.entityPromptCache[uid];
  //   }

  //   const promptKey = `rlc:db:YYYY:entity:${uid}:prompts:info`;
  //   let prompt /*string*/ = await client.GET(promptKey);

  //   if (prompt) {
  //     this.entityPromptCache[uid] = prompt;
  //     return prompt;
  //   }

  //   return null;
  // }

  // async setPromptOf(uid, prompt) {
  //   const promptKey = `rlc:db:YYYY:${uid}:prompts:info`;
  //   await client.set(promptKey, prompt);
  //   this.entityPromptCache[uid] = prompt;
  //   return prompt;
  // }
}

const cache = new Cache();
export default cache;
