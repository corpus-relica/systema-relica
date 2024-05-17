import { createMachine } from "xstate";
const machine = () =>
    createMachine(
        {
            id: "smartSpec",
            initial: "First State",
            states: {
                "First State": {
                    on: {
                        next: [
                            {
                                target: "Second State",
                                actions: [],
                                meta: {},
                            },
                        ],
                    },
                },
                "Second State": {
                    on: {
                        next: [
                            {
                                target: "This",
                                actions: [],
                            },
                        ],
                    },
                },
                This: {
                    on: {
                        next: [
                            {
                                target: "is",
                                actions: [],
                            },
                        ],
                    },
                },
                is: {
                    on: {
                        next: [
                            {
                                target: "smartSpec !!",
                                actions: [],
                            },
                        ],
                    },
                },
                "smartSpec !!": {
                    on: {
                        finalize: [
                            {
                                target: "done",
                                actions: [],
                            },
                        ],
                    },
                },
                done: {
                    type: "final",
                },
            },
        },
        {
            actions: {},
            actors: {},
            guards: {},
            delays: {},
        }
    );
export default machine;
