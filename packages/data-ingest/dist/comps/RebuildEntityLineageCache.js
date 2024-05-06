import React, { useEffect, useState } from 'react';
import { Text, Box, useInput } from 'ink';
import { convertToInt, getLineage } from '../data/db.js';
import neo4jClient from '../Neo4jClient.js';
import { clearEntityLineageCacheComplete, addToEntityLineageCache, } from '../data/redis.js';
const BATCH_SIZE = 100;
const driver = neo4jClient.driver;
const countFacts = async () => {
    const session = driver.session();
    const result = await session.run('MATCH (n:Fact) RETURN count(n) as count');
    session.close();
    if (result.records.length === 0)
        return 0;
    return convertToInt(result.records[0]?.get('count'));
};
//@ts-ignore
const processNodes = async ({ updateCurrentBatch, }) => {
    let skip = 0;
    let hasMore = true;
    while (hasMore) {
        updateCurrentBatch(skip / BATCH_SIZE + 1);
        const session = driver.session();
        //@ts-ignore
        const nodes = await session.run(`
	  MATCH (n:Fact)
	  WHERE (n.rel_type_uid = 1146) OR (n.rel_type_uid = 1726)
	  RETURN n
	  ORDER BY n.fact_uid ASC
	  SKIP ${skip}
	  LIMIT ${BATCH_SIZE}
	`);
        // //@ts-ignore
        // const nodes = await session.run(`
        //   MATCH (n:Fact)
        //   WHERE (n.rel_type_uid = 1146) AND (n.lh_object_uid = 1000001510)
        //   RETURN n
        // `);
        session.close();
        if (nodes.records.length == 0) {
            hasMore = false;
            continue;
        }
        await Promise.all(nodes.records.map(async (nodeRecord) => {
            const node = nodeRecord.get('n');
            const raw_lh_object_uid = node.properties.lh_object_uid;
            if (raw_lh_object_uid === undefined) {
                return;
            }
            const lh_object_uid = convertToInt(raw_lh_object_uid);
            const lineage = await getLineage(lh_object_uid);
            // console.log('Lineage!!!!');
            // console.log(lineage);
            await addToEntityLineageCache(lh_object_uid, lineage);
        }));
        skip += BATCH_SIZE;
    }
    return;
};
const RebuildEntityLineageCache = ({ next }) => {
    const [count, setCount] = useState(0);
    //@ts-ignore
    const [currentBatch, updateCurrentBatch] = useState(0);
    const [done, setDone] = useState(false);
    // @ts-ignore
    useInput((input, key) => {
        if (key.return) {
            next();
        }
    });
    useEffect(() => {
        const init = async () => {
            const count = await countFacts();
            setCount(count);
            await clearEntityLineageCacheComplete();
            await processNodes({
                updateCurrentBatch,
            });
            setDone(true);
        };
        init();
    }, []);
    return (React.createElement(Box, { flexDirection: "column", flexGrow: 1 },
        React.createElement(Text, null, "RebuildEntityLineageCache"),
        React.createElement(Text, null,
            "Count: ",
            count),
        React.createElement(Text, null,
            "Processing batch ",
            currentBatch + 1,
            "/~",
            Math.ceil(count / BATCH_SIZE),
            " (x",
            BATCH_SIZE,
            ")"),
        done && React.createElement(Text, null, "Done")));
};
export default RebuildEntityLineageCache;
