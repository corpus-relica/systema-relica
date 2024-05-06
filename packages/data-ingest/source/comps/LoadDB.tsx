import React, {useEffect, useState} from 'react';
import {Text, Box, useInput} from 'ink';

import {
	loadFromFileCreateNodes,
	loadFromFileCreateRelationships,
} from '../data/db.js';

import {processFilesInDirectory} from '../utils/file.js';

import {neo4jImportDir} from '../constants.js';

type Props = {
	next: () => void;
	selectedFiles: string[];
};

const LoadDB = ({next, selectedFiles}: Props) => {
	const [completed, setCompleted] = useState(false);
	const [logbook, setLogbook] = useState<string[]>([]);

	//@ts-ignore
	useInput((input, key) => {
		if (key.return && completed) {
			// console.log('ENTER PRESSED IN INTRO');
			next();
		}
	});

	useEffect(() => {
		const log = (str: string) => {
			setLogbook(prevLogbook => [...prevLogbook, str]);
		};
		const exec = async () => {
			await processFilesInDirectory(
				neo4jImportDir,
				async (filename: string) => {
					await loadFromFileCreateNodes(
						'relica/' + encodeURIComponent(filename),
						log,
					);
				},
			);
			await processFilesInDirectory(neo4jImportDir, async filename => {
				await loadFromFileCreateRelationships(
					'relica/' + encodeURIComponent(filename),
				);
			});
			log('LoadDB: useEffect: done');
			setCompleted(true);
		};

		exec();
	}, []);

	return (
		<Box flexDirection="column" width="100%">
			<Box flexDirection="row" flexGrow={1} height="100%">
				<Box flexDirection="column" flexGrow={1}>
					<Text>Load DB</Text>
					<Box flexDirection="column" width="50%">
						<Text>{selectedFiles.join('\n')}</Text>
					</Box>
				</Box>
				<Box flexDirection="column" flexGrow={1} width="50%" height="100%">
					<Text>Log:</Text>
					<Text>{logbook.join('\n')}</Text>
				</Box>
			</Box>
			{completed && (
				<Box flexDirection="column" width="100%">
					<Text>{'<enter> to continue.'}</Text>
				</Box>
			)}
		</Box>
	);
};

export default LoadDB;
