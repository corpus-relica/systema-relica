import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { InjectRedis } from '@nestjs-modules/ioredis';

@Injectable()
export class CacheService {
    /* to be clear this is a cache-cache. It is merely the portion of
     * the descendants cache that we have touched since the app started.
     */
    descendantsCache = null;
    entityPromptCache = null;

    constructor(@InjectRedis() private readonly redisClient: Redis) {
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

    async allDescendantsOf(uid: number): Promise<number[]> {
        const descendantsKey = `rlc:db:YYYY:entity:${uid}:descendants`;
        let descendants: any[] =
            await this.redisClient.smembers(descendantsKey);
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
        let descendants: any[] =
            await this.redisClient.smembers(descendantsKey);
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
                ...this.descendantsCache[uid],
                descendant,
            ];
        }
    }

    //--------------------------------------------------------------------- LINEAGE

    async lineageOf(uid: number) {
        try {
            const lineageKey = `rlc:db:YYYY:entity:${uid}:lineage`;
            let lineage: any[] = await this.redisClient.lrange(
                lineageKey,
                0,
                -1,
            );
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

    //--------------------------------------------------------------------- ENTITY

    async getMinFreeEntityUID() {
        const minFreeEntityUIDKey = `rlc:db:YYYY:minFreeEntityUID`;
        const minFreeEntityUID =
            await this.redisClient.get(minFreeEntityUIDKey);
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
}
