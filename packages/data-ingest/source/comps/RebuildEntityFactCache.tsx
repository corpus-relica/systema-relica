import React, {useEffect, useState} from 'react';
import {Text, Box, useInput} from 'ink';
import {convertToInt} from '../data/db.js';
import neo4jClient from '../Neo4jClient.js';
import {
	clearEntityFactsCacheComplete,
	addToEntityFactsCache,
} from '../data/redis.js';

const BATCH_SIZE = 5000;

const driver = neo4jClient.driver;

const countFacts = async () => {
	const session = driver.session();
	const result = await session.run('MATCH (n:Fact) RETURN count(n) as count');
	session.close();
	if (result.records.length === 0) return 0;
	return convertToInt(result.records[0]?.get('count'));
};

type Props = {
	next: () => void;
};

//@ts-ignore
const processNodes = async ({
	updateCurrentBatch,
}: {
	updateCurrentBatch: (batch: number) => void;
}) => {
	let skip = 0;
	let hasMore = true;

	while (hasMore) {
		updateCurrentBatch(skip / BATCH_SIZE + 1);

		const session = driver.session();
		//@ts-ignore
		const nodes = await session.run(`
      MATCH (n:Fact)
      RETURN n
      ORDER BY n.fact_uid ASC
      SKIP ${skip}
      LIMIT ${BATCH_SIZE}
    `);
		session.close();

		if (nodes.records.length == 0) {
			hasMore = false;
			continue;
		}

		await Promise.all(
			nodes.records.map(async nodeRecord => {
				const node = nodeRecord.get('n');
				const raw_lh_object_uid = node.properties.lh_object_uid;
				const raw_rh_object_uid = node.properties.rh_object_uid;
				const raw_fact_uid = node.properties.fact_uid;
				if (
					raw_lh_object_uid === undefined ||
					raw_rh_object_uid === undefined ||
					raw_fact_uid === undefined
				) {
					return;
				}
				const lh_object_uid = convertToInt(raw_lh_object_uid);
				const rh_object_uid = convertToInt(raw_rh_object_uid);
				const fact_uid = convertToInt(raw_fact_uid);

				await addToEntityFactsCache(lh_object_uid, fact_uid);
				await addToEntityFactsCache(rh_object_uid, fact_uid);
			}),
		);

		skip += BATCH_SIZE;
	}
};

const RebuildEntityFactCache = ({next}: Props) => {
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
			await clearEntityFactsCacheComplete();
			await processNodes({
				updateCurrentBatch,
			});
			setDone(true);
		};
		init();
	}, []);

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Text>RebuildEntityFactCache</Text>
			<Text>Count: {count}</Text>
			<Text>
				Processing batch {currentBatch + 1}/~{Math.ceil(count / BATCH_SIZE)} (x
				{BATCH_SIZE})
			</Text>
			{done && <Text>Done</Text>}
		</Box>
	);
};

export default RebuildEntityFactCache;
