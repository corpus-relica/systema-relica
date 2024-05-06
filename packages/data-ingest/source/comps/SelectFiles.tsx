import React, {useState} from 'react';
import {Text, Box} from 'ink';
import {MultiSelect} from '@inkjs/ui';

type Props = {
	next: () => void;
	files: string[];
	setSelectedFiles: (files: string[]) => void;
};

const SelectFiles = ({files, next, setSelectedFiles}: Props) => {
	const [value, setValue] = useState<string[]>([]);

	const options = files.map(f => {
		return {
			label: f,
			value: f,
		};
	});

	const handleChange = (newValue: string[]) => {
		setValue(newValue);
	};

	const handleSubmit = (newValue: string[]) => {
		// console.log('submit', newValue);
		// setValue(newValue);
		setSelectedFiles(newValue);
		next();
	};

	return (
		<Box flexDirection="column" width="100%">
			<Box flexDirection="row" flexGrow={1} height="100%">
				<Box flexDirection="column" width="50%" height="100%">
					<Text>
						<Text color="green">Select Files to Import</Text>
					</Text>
					<MultiSelect
						options={options}
						onChange={handleChange}
						onSubmit={handleSubmit}
					/>
				</Box>
				<Box flexDirection="column" width="50%" height="100%">
					<Text>Selected:</Text>
					<Text>{value.join('\n')}</Text>
				</Box>
			</Box>

			<Box flexDirection="column" width="100%">
				<Text>
					{
						'Arrow keys (up, down) to scroll, <space> to select/deselect, <enter> to continue'
					}
				</Text>
			</Box>
		</Box>
	);
};

export default SelectFiles;
