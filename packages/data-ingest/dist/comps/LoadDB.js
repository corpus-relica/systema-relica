import React, { useEffect, useState } from 'react';
import { Text, Box, useInput } from 'ink';
import { loadFromFileCreateNodes, loadFromFileCreateRelationships, } from '../data/db.js';
import { processFilesInDirectory } from '../utils/file.js';
import { neo4jImportDir } from '../constants.js';
const LoadDB = ({ next, selectedFiles }) => {
    const [completed, setCompleted] = useState(false);
    const [logbook, setLogbook] = useState([]);
    //@ts-ignore
    useInput((input, key) => {
        if (key.return && completed) {
            // console.log('ENTER PRESSED IN INTRO');
            next();
        }
    });
    useEffect(() => {
        const log = (str) => {
            setLogbook(prevLogbook => [...prevLogbook, str]);
        };
        const exec = async () => {
            await processFilesInDirectory(neo4jImportDir, async (filename) => {
                await loadFromFileCreateNodes('relica/' + encodeURIComponent(filename), log);
            });
            await processFilesInDirectory(neo4jImportDir, async (filename) => {
                await loadFromFileCreateRelationships('relica/' + encodeURIComponent(filename));
            });
            log('LoadDB: useEffect: done');
            setCompleted(true);
        };
        exec();
    }, []);
    return (React.createElement(Box, { flexDirection: "column", width: "100%" },
        React.createElement(Box, { flexDirection: "row", flexGrow: 1, height: "100%" },
            React.createElement(Box, { flexDirection: "column", flexGrow: 1 },
                React.createElement(Text, null, "Load DB"),
                React.createElement(Box, { flexDirection: "column", width: "50%" },
                    React.createElement(Text, null, selectedFiles.join('\n')))),
            React.createElement(Box, { flexDirection: "column", flexGrow: 1, width: "50%", height: "100%" },
                React.createElement(Text, null, "Log:"),
                React.createElement(Text, null, logbook.join('\n')))),
        completed && (React.createElement(Box, { flexDirection: "column", width: "100%" },
            React.createElement(Text, null, '<enter> to continue.')))));
};
export default LoadDB;
