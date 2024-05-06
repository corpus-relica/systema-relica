import React, {useEffect} from 'react';
import {Text, Box, useInput} from 'ink';
import {getFactsAboveThreshold, remOrphanNodes} from '../dbOperations.js';
import {Fact} from '../types.js';
import deleteOne from '../deleteOneFact.js';

type Props = {
	next: () => void;
};

export default function UnloadUserSpace({next}: Props) {
	//@ts-ignore
	useInput((input, key) => {
		if (key.return) {
			next();
		}
	});

	useEffect(() => {
		console.log('START: UnloadUserSpace');
		// find uids
		const exec = async () => {
			const facts: Fact[] = await getFactsAboveThreshold(2000000000);
			// delete facts seqeuentially
			for (const fact of facts) {
				await deleteOne(fact);
			}

			// remove orphan nodes
			await remOrphanNodes();

			console.log('END: UnloadUserSpace');
		};
		exec();
	}, []);

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Text>{'//// Unload User Space ////'}</Text>
		</Box>
	);
}
