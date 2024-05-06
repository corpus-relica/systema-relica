import { setup } from 'xstate';
export const machine = setup({
    types: {
        context: {},
        events: {},
    },
    // schemas: {
    // 	events: {
    // 		back: {
    // 			type: 'object',
    // 			properties: {},
    // 		},
    // 		next: {
    // 			type: 'object',
    // 			properties: {},
    // 		},
    // 		loadUS: {
    // 			type: 'object',
    // 			properties: {},
    // 		},
    // 		unloadUS: {
    // 			type: 'object',
    // 			properties: {},
    // 		},
    // 		rebuildEFCache: {
    // 			type: 'object',
    // 			properties: {},
    // 		},
    // 		rebuildELCache: {
    // 			type: 'object',
    // 			properties: {},
    // 		},
    // 	},
    // },
}).createMachine({
    context: {},
    id: 'Data Ingest',
    initial: 'intro',
    states: {
        intro: {
            on: {
                next: {
                    target: 'selectFiles',
                },
                loadUS: {
                    target: 'loadUserSpace',
                },
                unloadUS: {
                    target: 'unloadUserSpace',
                },
                rebuildEFCache: {
                    target: 'rebuildEntityFactCache',
                },
                rebuildELCache: {
                    target: 'rebuildEntityLineageCache',
                },
            },
        },
        selectFiles: {
            on: {
                next: {
                    target: 'selectDBClearOptions',
                },
            },
            description: '',
        },
        loadUserSpace: {
            on: {
                next: {
                    target: 'end',
                },
            },
        },
        unloadUserSpace: {
            on: {
                next: {
                    target: 'end',
                },
            },
        },
        rebuildEntityFactCache: {
            on: {
                next: {
                    target: 'end',
                },
            },
        },
        rebuildEntityLineageCache: {
            on: {
                next: {
                    target: 'end',
                },
            },
        },
        selectDBClearOptions: {
            on: {
                back: {
                    target: 'selectFiles',
                },
                next: {
                    target: 'preprocessData',
                },
            },
            description: '',
        },
        end: {},
        preprocessData: {
            on: {
                next: {
                    target: 'clearDB',
                },
            },
        },
        clearDB: {
            on: {
                next: {
                    target: 'loadDB',
                    description: '',
                },
            },
        },
        loadDB: {
            on: {
                next: {
                    target: 'buildSubtypesCache',
                },
            },
        },
        buildSubtypesCache: {
            on: {
                next: {
                    target: 'end',
                },
            },
        },
    },
});
