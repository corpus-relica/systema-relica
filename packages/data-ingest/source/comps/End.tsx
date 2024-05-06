import React from 'react';
import {Text, Box, useInput} from 'ink';

type Props = {};

const End = ({}: Props) => {
	//@ts-ignore
	useInput((input, key) => {
		process.exit(0);
	});

	return (
		<Box flexDirection="column" flexGrow={1}>
			<Text>END : FINAL REPORT</Text>
			<Text>press any key to exit</Text>
		</Box>
	);
};

export default End;
