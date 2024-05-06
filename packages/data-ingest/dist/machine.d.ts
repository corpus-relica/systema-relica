export declare const machine: import("xstate").StateMachine<{}, {
    type: 'back';
} | {
    type: 'next';
} | {
    type: 'loadUS';
} | {
    type: 'unloadUS';
} | {
    type: 'rebuildEFCache';
} | {
    type: 'rebuildELCache';
}, Record<string, import("xstate").AnyActorRef>, {
    src: string;
    logic: import("xstate").UnknownActorLogic;
    id: string | undefined;
}, {
    type: string;
    params: import("xstate").NonReducibleUnknown;
}, {
    type: string;
    params: import("xstate").NonReducibleUnknown;
}, string, "end" | "intro" | "selectFiles" | "loadUserSpace" | "unloadUserSpace" | "rebuildEntityFactCache" | "rebuildEntityLineageCache" | "selectDBClearOptions" | "preprocessData" | "clearDB" | "loadDB" | "buildSubtypesCache", string, unknown, import("xstate").NonReducibleUnknown, import("xstate").ResolveTypegenMeta<import("xstate").TypegenDisabled, {
    type: 'back';
} | {
    type: 'next';
} | {
    type: 'loadUS';
} | {
    type: 'unloadUS';
} | {
    type: 'rebuildEFCache';
} | {
    type: 'rebuildELCache';
}, {
    src: string;
    logic: import("xstate").UnknownActorLogic;
    id: string | undefined;
}, {
    type: string;
    params: import("xstate").NonReducibleUnknown;
}, {
    type: string;
    params: import("xstate").NonReducibleUnknown;
}, string, string>>;
