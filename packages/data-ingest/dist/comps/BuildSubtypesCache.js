import React, { useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import { updateDescendantsInDB } from '../data/redis.js';
import { fetchPathsToRoot, convertToInt } from '../data/db.js';
import neo4jClient from '../Neo4jClient.js';
const driver = neo4jClient.driver;
function processPath(paths) {
    // Map to hold node-to-descendants mapping
    const nodeToDescendants = new Map();
    paths.forEach(path => {
        const origin = path.start;
        const originUid = convertToInt(origin.properties.uid);
        path.segments.forEach((segment) => {
            const entityNode = segment.end;
            const { labels } = entityNode;
            if (labels.includes('Entity')) {
                const entityNodeUid = convertToInt(entityNode.properties.uid);
                // If this node doesn't have a descendants list yet, initialize one
                if (!nodeToDescendants.has(entityNodeUid)) {
                    nodeToDescendants.set(entityNodeUid, new Set());
                }
                const descendantsSet = nodeToDescendants.get(entityNodeUid);
                descendantsSet.add(originUid);
            }
        });
    });
    return nodeToDescendants;
}
const postProcessNodes = async (batchSize = 1000) => {
    let skip = 0;
    let hasMore = true;
    while (hasMore) {
        console.log(`Processing batch ${skip / batchSize + 1}...`);
        const session = driver.session();
        const nodes = await session.run(`
      MATCH (node:Entity)
      RETURN node
      ORDER BY node.uid
      SKIP ${skip}
      LIMIT ${batchSize}
    `);
        session.close();
        if (nodes.records.length == 0) {
            hasMore = false;
            continue;
        }
        console.log(`Fetched ${nodes.records.length} nodes`);
        console.log('Processing paths...');
        // Step 2: Fetch paths for all nodes in this batch
        const allPaths = [];
        for (const nodeRecord of nodes.records) {
            const node = nodeRecord.get('node');
            const uid = convertToInt(node.properties.uid);
            const paths = await fetchPathsToRoot(uid);
            allPaths.push(...paths); // combine all paths into one list
        }
        console.log(`Processed ${allPaths.length} paths`);
        console.log('Processing descendants...');
        // Step 3: Process all paths for this batch
        const nodeToDescendants = processPath(allPaths);
        console.log(`Processed ${nodeToDescendants.size} descendants`);
        console.log('Inserting to cache...');
        // Step 4: Update Neo4j with the descendants for all nodes in this batch
        await updateDescendantsInDB(nodeToDescendants);
        skip += batchSize;
        console.log('--------------------');
    }
};
const BuildSubtypesCache = ({ next }) => {
    //@ts-ignore
    useInput((input, key) => {
        if (key.return) {
            // console.log('ENTER PRESSED IN INTRO');
            next();
        }
    });
    useEffect(() => {
        postProcessNodes().then(() => {
            console.log('Done');
        });
    }, []);
    return (React.createElement(Box, { flexDirection: "row", flexGrow: 1 },
        React.createElement(Text, null, "BuildSubtypesCache")));
};
export default BuildSubtypesCache;
