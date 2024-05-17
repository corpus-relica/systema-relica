import { createMachine, emit } from "xstate";

const machine = () =>
    createMachine(
        {
            id: "dummySpec",
            initial: "Initial",
            states: {
                Initial: {
                    on: {
                        next: [
                            {
                                target: "Another",
                                actions: [],
                                meta: {},
                            },
                        ],
                    },
                },
                Another: {
                    entry: {
                        type: "invokeSmartSpec",
                    },
                    on: {
                        next: [
                            {
                                target: "Parent",
                                actions: [],
                            },
                        ],
                    },
                },
                Parent: {
                    initial: "Child",
                    states: {
                        Child: {
                            on: {
                                next: [
                                    {
                                        target: "AnotherChild",
                                        actions: [],
                                        meta: {},
                                    },
                                ],
                                back: [
                                    {
                                        target: "#dummySpec.Initial",
                                        actions: [
                                            {
                                                type: "reset",
                                            },
                                        ],
                                        meta: {},
                                    },
                                ],
                            },
                        },
                        AnotherChild: {
                            initial: "ChildChild",
                            states: {
                                ChildChild: {
                                    on: {
                                        next: [
                                            {
                                                target: "AnotherChildChild",
                                                actions: [],
                                            },
                                        ],
                                    },
                                },
                                AnotherChildChild: {
                                    on: {
                                        next: [
                                            {
                                                target: "#dummySpec.Penultimate",
                                                actions: [],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                Penultimate: {
                    on: {
                        finalize: [
                            {
                                target: "Final",
                                actions: [],
                            },
                        ],
                    },
                },
                Final: {
                    type: "final",
                },
            },
        },
        {
            actions: {
                reset: ({ context, event }) => {},
                invokeSmartSpec: emit({ type: "invoke", data: "smartSpec" }),
            },
            actors: {},
            guards: {},
            delays: {},
        }
    );

export default machine;
export * from "./stateComps";
