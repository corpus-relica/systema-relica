import React from 'react';
import { Text, Box } from 'ink';
import { Select } from '@inkjs/ui';
export default function Intro({ next, loadUS, unloadUS, rebuildEFCache, rebuildELCache, }) {
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
    const handleSelect = (value) => {
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
    return (React.createElement(Box, { flexDirection: "column", width: "100%" },
        React.createElement(Box, { flexDirection: "column", flexGrow: 1 },
            React.createElement(Text, null, '//// intro to data ingest sucker!!! ////'),
            React.createElement(Text, null, "select operation:"),
            React.createElement(Select, { options: options, onChange: handleSelect })),
        React.createElement(Box, { flexDirection: "column", width: "100%" },
            React.createElement(Text, null, 'Arrow keys (up, down) to scroll,  <enter> to select and continue'))));
}
