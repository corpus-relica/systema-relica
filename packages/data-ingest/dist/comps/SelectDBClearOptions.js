import React from 'react';
import { Text, Box, useInput } from 'ink';
import { Select } from '@inkjs/ui';
export default function SelectDBClearOptions({ next, back, setSelectedDBClearOption, }) {
    //@ts-ignore
    useInput((input, key) => {
        if (key.escape)
            back();
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
    return (React.createElement(Box, { flexDirection: "column", width: "100%" },
        React.createElement(Box, { flexDirection: "column", flexGrow: 1 },
            React.createElement(Text, null, "Select DB Clear Options"),
            React.createElement(Select, { options: options, onChange: newValue => {
                    setSelectedDBClearOption(newValue);
                    next();
                } })),
        React.createElement(Box, { flexDirection: "column", width: "100%" },
            React.createElement(Text, null, '<esc> to go back, <up, down> to scroll,  <enter> to select and continue'))));
}
