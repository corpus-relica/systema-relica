import React from 'react';
import { Text, Box, useInput } from 'ink';
const End = ({}) => {
    //@ts-ignore
    useInput((input, key) => {
        process.exit(0);
    });
    return (React.createElement(Box, { flexDirection: "column", flexGrow: 1 },
        React.createElement(Text, null, "END : FINAL REPORT"),
        React.createElement(Text, null, "press any key to exit")));
};
export default End;
