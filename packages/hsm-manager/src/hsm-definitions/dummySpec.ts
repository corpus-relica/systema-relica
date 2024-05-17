import { createMachine, emit } from "xstate";

const machine = () =>
    createMachine(
        {
            id: "Untitled",
            initial: "Initial state",
            states: {
                "Initial state": {
                    on: {
                        next: [
                            {
                                target: "Another state",
                                actions: [],
                                meta: {},
                            },
                        ],
                    },
                },
                "Another state": {
                    entry: {
                        type: "emitEvent",
                    },
                    on: {
                        next: [
                            {
                                target: "Parent state",
                                actions: [],
                            },
                        ],
                    },
                },
                "Parent state": {
                    initial: "Child state",
                    states: {
                        "Child state": {
                            on: {
                                next: [
                                    {
                                        target: "Another child state",
                                        actions: [],
                                        meta: {},
                                    },
                                ],
                                back: [
                                    {
                                        target: "#Untitled.Initial state",
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
                        "Another child state": {
                            initial: "Child-Child State",
                            states: {
                                "Child-Child State": {
                                    on: {
                                        next: [
                                            {
                                                target: "Another Child-Child State",
                                                actions: [],
                                            },
                                        ],
                                    },
                                },
                                "Another Child-Child State": {
                                    on: {
                                        next: [
                                            {
                                                target: "#Untitled.Penultimate State",
                                                actions: [],
                                            },
                                        ],
                                    },
                                },
                            },
                        },
                    },
                },
                "Penultimate State": {
                    on: {
                        finalize: [
                            {
                                target: "Final State",
                                actions: [],
                            },
                        ],
                    },
                },
                "Final State": {
                    type: "final",
                },
            },
        },
        {
            actions: {
                reset: ({ context, event }) => {},
                emitEvent: emit({ type: "invoke", data: "some-shit" }),
            },
            actors: {},
            guards: {},
            delays: {},
        }
    );

export default machine;
