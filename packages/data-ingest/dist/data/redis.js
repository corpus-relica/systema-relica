import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();
// console.log(' == CONNECT REDIS ===');
// console.log(' -- uri -- ', process.env['RELICA_REDIS_URL']);
// console.log(' -- pw -- ', process.env['RELICA_REDIS_PASSWORD']);
export const client = createClient({
    url: process.env['RELICA_REDIS_URL'],
    password: process.env['RELICA_REDIS_PASSWORD'],
});
client.on('error', err => console.log('Redis Client Error', err));
await client.connect();
//-------------------------------------------------------------------------
export const updateDescendantsInDB = async (nodeToDescendants) => {
    for (const [nodeUid, descendantsSet] of nodeToDescendants.entries()) {
        try {
            const newDescendants = Array.from(descendantsSet).map(uid => uid.toString());
            const ns = 'rlc:db:YYYY:entity:' + nodeUid + ':descendants';
            // client.SADD(ns, newDescendants);
            for (const descendant of newDescendants) {
                const isMember = await client.SISMEMBER(ns, descendant);
                if (isMember === false) {
                    client.SADD(ns, descendant);
                }
                else {
                    console.log('already exists');
                }
            }
        }
        catch (error) {
            console.error(`updateDescendantsInDB:Failed to update descendants for node ${nodeUid}:`, error);
        }
    }
};
//-------------------------------------------------------------------------
export const addToSubtypesCache = async (nodeUid, subtypeUid) => {
    try {
        const ns = 'rlc:db:YYYY:entity:' + nodeUid + ':descendants';
        const isMember = await client.SISMEMBER(ns, subtypeUid.toString());
        if (isMember === false) {
            client.SADD(ns, subtypeUid.toString());
        }
        else {
            console.log('already exists');
        }
    }
    catch (error) {
        console.error(`addToSubtypesCache:Failed to update descendants for node ${nodeUid}:`, error);
    }
};
export const removeFromSubtypesCache = async (nodeUid, subtypeUid) => {
    try {
        const ns = 'rlc:db:YYYY:entity:' + nodeUid + ':descendants';
        const isMember = await client.SISMEMBER(ns, subtypeUid.toString());
        if (isMember === true) {
            client.SREM(ns, subtypeUid.toString());
        }
        else {
            console.log('already removed');
        }
    }
    catch (error) {
        console.error(`removeFromSubtypesCache:Failed to update descendants for node ${nodeUid}:`, error);
    }
};
//-------------------------------------------------------------------------
export const clearEntityFactsCacheComplete = async () => {
    let cursor = 0; // Start with cursor as a number
    do {
        // Correct call format with cursor as a number and options as the second argument
        const reply = await client.scan(cursor, {
            MATCH: 'rlc:db:YYYY:entity:*:facts',
            COUNT: 100,
        });
        cursor = reply.cursor; // Assuming cursor should be a number according to the error messages
        const keys = reply.keys;
        if (keys.length) {
            await client.del(keys);
        }
    } while (cursor !== 0); // Repeat until SCAN has iterated through the entire keyspace, checking cursor as a number
};
export const addToEntityFactsCache = async (entityUid, factUid) => {
    try {
        const ns = 'rlc:db:YYYY:entity:' + entityUid + ':facts';
        const factUidStr = factUid + '';
        const isMember = await client.SISMEMBER(ns, factUidStr);
        if (isMember === false) {
            await client.SADD(ns, factUidStr);
        }
        else {
            // console.log('already exists');
        }
    }
    catch (error) {
        console.error(`addToEntityFactsCache:Failed to update facts for entity ${entityUid}:`, error);
    }
};
//-------------------------------------------------------------------------
export const clearEntityLineageCacheComplete = async () => {
    let cursor = 0;
    do {
        // console.log('cursor', cursor);
        try {
            const reply = await client.scan(cursor, {
                MATCH: 'rlc:db:YYYY:entity:*:lineage',
                COUNT: 100,
            });
            cursor = reply.cursor;
            const keys = reply.keys;
            if (keys.length === 0) {
                console.log('No matching keys found.');
            }
            else {
                await client.del(keys);
            }
        }
        catch (error) {
            console.error('Error occurred during Redis scan:', error);
            break; // Exit the loop if an error occurs
        }
    } while (cursor !== 0);
};
export const addToEntityLineageCache = async (entityUid, lineage) => {
    // console.log('addToEntityLineageCache', entityUid, lineage);
    try {
        const ns = 'rlc:db:YYYY:entity:' + entityUid + ':lineage';
        const lineageStrArray = lineage.map(uid => uid.toString());
        await client.LPUSH(ns, lineageStrArray);
        return;
    }
    catch (error) {
        console.error(`addToEntityLineageCache:Failed to update lineage for entity ${entityUid}:`, error);
        console.log(entityUid, lineage);
    }
};
//-------------------------------------------------------------------------
export const getMinFreeEntityUID = async () => {
    const minFreeEntityUIDKey = `rlc:db:YYYY:minFreeEntityUID`;
    const minFreeEntityUID = await client.get(minFreeEntityUIDKey);
    if (minFreeEntityUID) {
        return +minFreeEntityUID;
    }
    return 0;
};
export const setMinFreeEntityUID = async (uid) => {
    const minFreeEntityUIDKey = `rlc:db:YYYY:minFreeEntityUID`;
    await client.set(minFreeEntityUIDKey, '' + uid);
};
export const getMinFreeFactUID = async () => {
    const minFreeFactUIDKey = `rlc:db:YYYY:minFreeFactUID`;
    const minFreeFactUID = await client.get(minFreeFactUIDKey);
    if (minFreeFactUID) {
        return +minFreeFactUID;
    }
    return 0;
};
export const setMinFreeFactUID = async (uid) => {
    const minFreeFactUIDKey = `rlc:db:YYYY:minFreeFactUID`;
    await client.set(minFreeFactUIDKey, '' + uid);
};
