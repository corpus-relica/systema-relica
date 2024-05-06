import React from 'react';
import {Text, Box} from 'ink';
import {Select} from '@inkjs/ui';

type Props = {
	next: () => void;
	loadUS: () => void;
	unloadUS: () => void;
	rebuildEFCache: () => void;
	rebuildELCache: () => void;
};

export default function Intro({
	next,
	loadUS,
	unloadUS,
	rebuildEFCache,
	rebuildELCache,
}: Props) {
	const options = [
		{
			label: 'Main',
			value: 'next',
		},
		{
			label: 'Load User Data',
			value: 'loadUS',
		},
		{
			label: 'Unload User Data',
			value: 'unloadUS',
		},
		{
			label: 'Rebuild enities-fact cache',
			value: 'rebuildEFCache',
		},
		{
			label: 'Rebuild enities-lineage cache',
			value: 'rebuildELCache',
		},
	];

	const handleSelect = (value: string) => {
		switch (value) {
			case 'next':
				next();
				break;
			case 'loadUS':
				loadUS();
				break;
			case 'unloadUS':
				unloadUS();
				break;
			case 'rebuildEFCache':
				rebuildEFCache();
				break;
			case 'rebuildELCache':
				rebuildELCache();
				break;
			default:
				break;
		}
	};

	return (
		<Box flexDirection="column" width="100%">
			<Box flexDirection="column" flexGrow={1}>
				<Text>{'//// intro to data ingest sucker!!! ////'}</Text>
				<Text>select operation:</Text>
				<Select options={options} onChange={handleSelect} />
			</Box>
			<Box flexDirection="column" width="100%">
				<Text>
					{'Arrow keys (up, down) to scroll,  <enter> to select and continue'}
				</Text>
			</Box>
		</Box>
	);
}
