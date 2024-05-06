import React from 'react';
import {Text, Box, useInput} from 'ink';
import {Select} from '@inkjs/ui';

type Props = {
	next: () => void;
	back: () => void;
	setSelectedDBClearOption: (selectedDBClearOption: string) => void;
};

export default function SelectDBClearOptions({
	next,
	back,
	setSelectedDBClearOption,
}: Props) {
	//@ts-ignore
	useInput((input, key) => {
		if (key.escape) back();
	});

	const options = [
		{
			label: 'Clear None',
			value: 'none',
		},
		{
			label: 'Clear User Data',
			value: 'user',
		},
		{
			label: 'Clear All',
			value: 'all',
		},
	];

	return (
		<Box flexDirection="column" width="100%">
			<Box flexDirection="column" flexGrow={1}>
				<Text>Select DB Clear Options</Text>
				<Select
					options={options}
					onChange={newValue => {
						setSelectedDBClearOption(newValue);
						next();
					}}
				/>
			</Box>
			<Box flexDirection="column" width="100%">
				<Text>
					{
						'<esc> to go back, <up, down> to scroll,  <enter> to select and continue'
					}
				</Text>
			</Box>
		</Box>
	);
}
