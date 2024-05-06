import React, {useState, useEffect, ReactElement} from 'react';
import {Box} from 'ink';
import {createActor} from 'xstate';

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
import {machine} from './machine.js';

type Props = {
	files: string[];
};

const actor = createActor(machine);

//@ts-ignore
const next = () => {
	// console.log('NEXT???');
	actor.send({type: 'next'});
};

//@ts-ignore
const back = () => {
	// console.log('back');
	actor.send({type: 'back'});
};

//@ts-ignore
const loadUS = () => {
	console.log('loadUS ???');
	actor.send({type: 'loadUS'});
};

//@ts-ignore
const unloadUS = () => {
	console.log('unloadUS');
	actor.send({type: 'unloadUS'});
};

//@ts-ignore
const rebuildEFCache = () => {
	console.log('rebuildEFCache');
	actor.send({type: 'rebuildEFCache'});
};

//@ts-ignore
const rebuildELCache = () => {
	console.log('rebuildELCache');
	actor.send({type: 'rebuildELCache'});
};

export default function App({files}: Props) {
	const [comp, setComp] = useState<ReactElement | null>(null);
	// const [comps, setComps] = useState<Record<string, ReactElement>>({});
	const [currentStateName, setCurrentStateName] = useState<null | string>(null);
	//@ts-ignore
	const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
	const [selectedDBClearOption, setSelectedDBClearOption] =
		useState<string>('none');

	useEffect(() => {
		actor.subscribe(state => {
			// console.log('/// PRESUMABLY ENTERED STATE:', state.value);
			setCurrentStateName(state.value as string);
		});

		actor.start();
	}, []);

	useEffect(() => {
		if (currentStateName) {
			switch (currentStateName) {
				case 'intro':
					setComp(
						<Intro
							next={next}
							loadUS={loadUS}
							unloadUS={unloadUS}
							rebuildEFCache={rebuildEFCache}
							rebuildELCache={rebuildELCache}
						/>,
					);
					break;
				case 'loadUserSpace':
					setComp(<LoadUserSpace next={next} />);
					break;
				case 'unloadUserSpace':
					setComp(<UnloadUserSpace next={next} />);
					break;
				case 'rebuildEntityFactCache':
					setComp(<RebuildEntityFactCache next={next} />);
					break;
				case 'rebuildEntityLineageCache':
					setComp(<RebuildEntityLineageCache next={next} />);
					break;
				case 'selectFiles':
					setComp(
						<SelectFiles
							files={files}
							next={next}
							setSelectedFiles={setSelectedFiles}
						/>,
					);
					break;
				case 'selectDBClearOptions':
					setComp(
						<SelectDBClearOptions
							next={next}
							back={back}
							setSelectedDBClearOption={setSelectedDBClearOption}
						/>,
					);
					break;
				case 'preprocessData':
					setComp(<PreprocessData next={next} selectedFiles={selectedFiles} />);
					break;
				case 'clearDB':
					setComp(
						<ClearDB
							next={next}
							selectedDBClearOption={selectedDBClearOption}
						/>,
					);
					break;
				case 'loadDB':
					setComp(<LoadDB next={next} selectedFiles={selectedFiles} />);
					break;
				case 'buildSubtypesCache':
					setComp(<BuildSubtypesCache next={next} />);
					break;
				case 'end':
					setComp(<End />);
					break;
				default:
					console.log('NO MATCH FOR STATE:', currentStateName);
					break;
			}
		}
	}, [currentStateName]);

	return (
		<Box flexDirection="row" height={20}>
			{comp}
		</Box>
	);
}
