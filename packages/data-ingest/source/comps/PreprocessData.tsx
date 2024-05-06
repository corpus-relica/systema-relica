import React, {useEffect, useState} from 'react';
import {Text, Box, useInput} from 'ink';
import {readXLSFixDatesAndSaveCSV} from '../datafile/xls.js';

type Props = {
	next: () => void;
	selectedFiles: string[];
};

const PreprocessData = ({next, selectedFiles}: Props) => {
	const [logbook, setLogbook] = useState<string[]>([]);

	//@ts-ignore
	useInput((input, key) => {
		if (key.return) {
			// console.log('ENTER PRESSED IN INTRO');
			next();
		}
	});

	useEffect(() => {
		const log = (str: string) => {
			setLogbook(prevLogbook => [...prevLogbook, str]);
		};
		readXLSFixDatesAndSaveCSV(selectedFiles, log);
	}, []);

	return (
		<Box flexDirection="column" width="100%">
			<Box flexDirection="row" flexGrow={1} height="100%">
				<Box flexDirection="column" flexGrow={1} width="50%" height="100%">
					<Text>Preprocess Data</Text>
					<Box flexDirection="column" width="50%">
						<Text>{selectedFiles.join('\n')}</Text>
					</Box>
				</Box>
				<Box flexDirection="column" flexGrow={1} width="50%" height="100%">
					<Text>Log:</Text>
					<Text>{logbook.join('\n')}</Text>
				</Box>
			</Box>
			<Box flexDirection="column" width="100%">
				<Text>{'<enter> to continue.'}</Text>
			</Box>
		</Box>
	);
};

export default PreprocessData;
