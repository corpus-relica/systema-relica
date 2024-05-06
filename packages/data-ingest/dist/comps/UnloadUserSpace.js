import React, { useEffect } from 'react';
import { Text, Box, useInput } from 'ink';
import { getFactsAboveThreshold, remOrphanNodes } from '../dbOperations.js';
import deleteOne from '../deleteOneFact.js';
export default function UnloadUserSpace({ next }) {
    //@ts-ignore
    useInput((input, key) => {
        if (key.return) {
            next();
        }
    });
    useEffect(() => {
        console.log('START: UnloadUserSpace');
        // find uids
        const exec = async () => {
            const facts = await getFactsAboveThreshold(2000000000);
            // delete facts seqeuentially
            for (const fact of facts) {
                await deleteOne(fact);
            }
            // remove orphan nodes
            await remOrphanNodes();
            console.log('END: UnloadUserSpace');
        };
        exec();
    }, []);
    return (React.createElement(Box, { flexDirection: "column", flexGrow: 1 },
        React.createElement(Text, null, '//// Unload User Space ////')));
}
