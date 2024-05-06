import React, { useState, useEffect } from 'react';
import { Box } from 'ink';
import { createActor } from 'xstate';
//@ts-ignore
import Intro from './comps/Intro.js';
import LoadUserSpace from './comps/LoadUserSpace.js';
import UnloadUserSpace from './comps/UnloadUserSpace.js';
import RebuildEntityFactCache from './comps/RebuildEntityFactCache.js';
import RebuildEntityLineageCache from './comps/RebuildEntityLineageCache.js';
import SelectFiles from './comps/SelectFiles.js';
import SelectDBClearOptions from './comps/SelectDBClearOptions.js';
import PreprocessData from './comps/PreprocessData.js';
import ClearDB from './comps/ClearDB.js';
import LoadDB from './comps/LoadDB.js';
import BuildSubtypesCache from './comps/BuildSubtypesCache.js';
import End from './comps/End.js';
import { machine } from './machine.js';
const actor = createActor(machine);
//@ts-ignore
const next = () => {
    // console.log('NEXT???');
    actor.send({ type: 'next' });
};
//@ts-ignore
const back = () => {
    // console.log('back');
    actor.send({ type: 'back' });
};
//@ts-ignore
const loadUS = () => {
    console.log('loadUS ???');
    actor.send({ type: 'loadUS' });
};
//@ts-ignore
const unloadUS = () => {
    console.log('unloadUS');
    actor.send({ type: 'unloadUS' });
};
//@ts-ignore
const rebuildEFCache = () => {
    console.log('rebuildEFCache');
    actor.send({ type: 'rebuildEFCache' });
};
//@ts-ignore
const rebuildELCache = () => {
    console.log('rebuildELCache');
    actor.send({ type: 'rebuildELCache' });
};
export default function App({ files }) {
    const [comp, setComp] = useState(null);
    // const [comps, setComps] = useState<Record<string, ReactElement>>({});
    const [currentStateName, setCurrentStateName] = useState(null);
    //@ts-ignore
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedDBClearOption, setSelectedDBClearOption] = useState('none');
    useEffect(() => {
        actor.subscribe(state => {
            // console.log('/// PRESUMABLY ENTERED STATE:', state.value);
            setCurrentStateName(state.value);
        });
        actor.start();
    }, []);
    useEffect(() => {
        if (currentStateName) {
            switch (currentStateName) {
                case 'intro':
                    setComp(React.createElement(Intro, { next: next, loadUS: loadUS, unloadUS: unloadUS, rebuildEFCache: rebuildEFCache, rebuildELCache: rebuildELCache }));
                    break;
                case 'loadUserSpace':
                    setComp(React.createElement(LoadUserSpace, { next: next }));
                    break;
                case 'unloadUserSpace':
                    setComp(React.createElement(UnloadUserSpace, { next: next }));
                    break;
                case 'rebuildEntityFactCache':
                    setComp(React.createElement(RebuildEntityFactCache, { next: next }));
                    break;
                case 'rebuildEntityLineageCache':
                    setComp(React.createElement(RebuildEntityLineageCache, { next: next }));
                    break;
                case 'selectFiles':
                    setComp(React.createElement(SelectFiles, { files: files, next: next, setSelectedFiles: setSelectedFiles }));
                    break;
                case 'selectDBClearOptions':
                    setComp(React.createElement(SelectDBClearOptions, { next: next, back: back, setSelectedDBClearOption: setSelectedDBClearOption }));
                    break;
                case 'preprocessData':
                    setComp(React.createElement(PreprocessData, { next: next, selectedFiles: selectedFiles }));
                    break;
                case 'clearDB':
                    setComp(React.createElement(ClearDB, { next: next, selectedDBClearOption: selectedDBClearOption }));
                    break;
                case 'loadDB':
                    setComp(React.createElement(LoadDB, { next: next, selectedFiles: selectedFiles }));
                    break;
                case 'buildSubtypesCache':
                    setComp(React.createElement(BuildSubtypesCache, { next: next }));
                    break;
                case 'end':
                    setComp(React.createElement(End, null));
                    break;
                default:
                    console.log('NO MATCH FOR STATE:', currentStateName);
                    break;
            }
        }
    }, [currentStateName]);
    return (React.createElement(Box, { flexDirection: "row", height: 20 }, comp));
}
