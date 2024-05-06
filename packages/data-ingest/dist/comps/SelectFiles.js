import React, { useState } from 'react';
import { Text, Box } from 'ink';
import { MultiSelect } from '@inkjs/ui';
const SelectFiles = ({ files, next, setSelectedFiles }) => {
    const [value, setValue] = useState([]);
    const options = files.map(f => {
        return {
            label: f,
            value: f,
        };
    });
    const handleChange = (newValue) => {
        setValue(newValue);
    };
    const handleSubmit = (newValue) => {
        // console.log('submit', newValue);
        // setValue(newValue);
        setSelectedFiles(newValue);
        next();
    };
    return (React.createElement(Box, { flexDirection: "column", width: "100%" },
        React.createElement(Box, { flexDirection: "row", flexGrow: 1, height: "100%" },
            React.createElement(Box, { flexDirection: "column", width: "50%", height: "100%" },
                React.createElement(Text, null,
                    React.createElement(Text, { color: "green" }, "Select Files to Import")),
                React.createElement(MultiSelect, { options: options, onChange: handleChange, onSubmit: handleSubmit })),
            React.createElement(Box, { flexDirection: "column", width: "50%", height: "100%" },
                React.createElement(Text, null, "Selected:"),
                React.createElement(Text, null, value.join('\n')))),
        React.createElement(Box, { flexDirection: "column", width: "100%" },
            React.createElement(Text, null, 'Arrow keys (up, down) to scroll, <space> to select/deselect, <enter> to continue'))));
};
export default SelectFiles;
