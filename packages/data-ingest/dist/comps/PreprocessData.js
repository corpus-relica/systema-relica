import React, { useEffect, useState } from 'react';
import { Text, Box, useInput } from 'ink';
import { readXLSFixDatesAndSaveCSV } from '../datafile/xls.js';
const PreprocessData = ({ next, selectedFiles }) => {
    const [logbook, setLogbook] = useState([]);
    //@ts-ignore
    useInput((input, key) => {
        if (key.return) {
            // console.log('ENTER PRESSED IN INTRO');
            next();
        }
    });
    useEffect(() => {
        const log = (str) => {
            setLogbook(prevLogbook => [...prevLogbook, str]);
        };
        readXLSFixDatesAndSaveCSV(selectedFiles, log);
    }, []);
    return (React.createElement(Box, { flexDirection: "column", width: "100%" },
        React.createElement(Box, { flexDirection: "row", flexGrow: 1, height: "100%" },
            React.createElement(Box, { flexDirection: "column", flexGrow: 1, width: "50%", height: "100%" },
                React.createElement(Text, null, "Preprocess Data"),
                React.createElement(Box, { flexDirection: "column", width: "50%" },
                    React.createElement(Text, null, selectedFiles.join('\n')))),
            React.createElement(Box, { flexDirection: "column", flexGrow: 1, width: "50%", height: "100%" },
                React.createElement(Text, null, "Log:"),
                React.createElement(Text, null, logbook.join('\n')))),
        React.createElement(Box, { flexDirection: "column", width: "100%" },
            React.createElement(Text, null, '<enter> to continue.'))));
};
export default PreprocessData;
