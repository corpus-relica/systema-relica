import React, {useEffect, useState} from 'react';
import {Text, Box, useInput} from 'ink';
import {clearDB} from '../dbOperations.js';

const END_OF_TEMP_UID_RANGE = 500;
const START_OF_FREE_UID_RANGE = 1000000000;
const START_OF_FACT_UID_RANGE = 2000000000;

type Props = {
	next: () => void;
	selectedDBClearOption: string;
};

const ClearDB = ({next, selectedDBClearOption}: Props) => {
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
		switch (selectedDBClearOption) {
			case 'all':
				clearDB(1000, 0, 0).then(() => {
					log('ClearDB: useEffect: all: done');
					setCompleted(true);
				});
				break;
			case 'user':
				clearDB(1000, START_OF_FREE_UID_RANGE, START_OF_FACT_UID_RANGE)
					.then(() => {
						return clearDB(1000, 0, END_OF_TEMP_UID_RANGE);
					})
					.then(() => {
						log('ClearDB: useEffect: user: done');
						setCompleted(true);
					});
				break;
			case 'none':
				log('ClearNone');
				setCompleted(true);
				break;
			default:
				log('ClearDB: useEffect: default');
				break;
		}
	}, []);

	return (
		<Box flexDirection="column" width="100%">
			<Box flexDirection="row" flexGrow={1} height="100%">
				<Box flexDirection="row" flexGrow={1}>
					<Text>Clear DB:</Text>
					<Text>{selectedDBClearOption}</Text>
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

export default ClearDB;
