import { Injectable } from '@nestjs/common';

import { collections } from 'src/graph/queries';
import { CacheService } from 'src/cache/cache.service';
import { GraphService } from 'src/graph/graph.service';

@Injectable()
export class EntityRetrievalService {
    constructor(
        private readonly cacheService: CacheService,
        private readonly graphService: GraphService,
    ) {}

    async getCollections() {
        const result = await this.graphService.execQuery(collections);

        return result[0]
            .get('collections')
            .map(({ name, uid }) => ({ name, uid: uid?.toNumber() }));
    }

    async getEntityType(uid: number) {
        if (uid === undefined) return undefined;
        if (uid === 730000) return 'anything';

        const q = `MATCH ()--(r)-->() WHERE r.lh_object_uid = $uid AND (r.rel_type_uid = 1146 OR r.rel_type_uid = 1726 OR r.rel_type_uid = 1225) RETURN r`;
        const result = await this.graphService.execQuery(q, { uid: +uid });

        if (result[0] === undefined) {
            console.error('No entity type found for uid', uid);
            return undefined;
        }

        const { rel_type_uid } = result[0].toObject().r.properties;

        if (!rel_type_uid) {
            console.error('No rel_type_uid found for uid', uid);
            console.log(result[0].toObject().r.properties);
            return undefined;
        }

        //TODO: figure out what situation this 'toInt()' call is meant to handl3e
        if (
            rel_type_uid === 1146 ||
            (rel_type_uid.toInt && rel_type_uid.toInt() === 1146)
        )
            return 'kind';
        if (
            rel_type_uid === 1726 ||
            (rel_type_uid.toInt && rel_type_uid.toInt() === 1726)
        )
            return 'qualification'; //which is a subtype of kind
        if (
            rel_type_uid === 1225 ||
            (rel_type_uid.toInt && rel_type_uid.toInt() === 1225)
        )
            return 'individual';
    }

    // async getPrompt(uid) {
    //     return this.cacheService.promptOf(uid);
    // }

    // async setPrompt(uid, prompt) {
    //     return this.cacheService.setPromptOf(uid, prompt);
    // }

    // async getMinFreeEntityUID() {
    //     return this.cacheService.minFreeEntityUID();
    // }

    // async setMinFreeEntityUID(uid) {
    //     return this.cacheService.setMinFreeEntityUID(uid);
    // }

    // async getMinFreeFactUID() {
    //     return this.cacheService.minFreeFactUID();
    // }

    // async setMinFreeFactUID(uid) {
    //     return this.cacheService.setMinFreeFactUID(uid);
    // }
}
