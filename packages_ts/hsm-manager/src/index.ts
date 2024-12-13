import type { AnyMachineSnapshot } from "xstate";
import { createActor /*ActorRef*/ } from "xstate";
import machineDefs from "./hsm-definitions";
// import { SharedLogger } from "./utils/logging";

interface StackItem {
    name: string;
    actor: any;
    snapshot: any;
}

//see: https://stately.ai/docs/migration#statenextevents-has-been-removed
function getNextEvents(snapshot: AnyMachineSnapshot) {
    return [
        ...new Set([...snapshot._nodes.flatMap((sn: any) => sn.ownEvents)]),
    ];
}

export * from "./hsm-definitions/";

export class HSMManager extends EventTarget {
    private stack: StackItem[] = [];
    private currentActor: any; //ActorRef<any> | null = null;
    private currentMachineName: string = "";
    private logger: any; //SharedLogger;
    private subscription: any;

    constructor() {
        super();
        this.logger = console;
    }

    initSubscription() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
        this.subscription = this.currentActor.subscribe({
            next: (snapshot: any) => {
                this.logger.log(
                    `State changed to: ${JSON.stringify(snapshot.value)}`
                );
                this.dispatchEvent(new Event("state:change"));
            },
            error: (err: any) => {
                this.logger.error(`Error in state machine: ${err}`);
            },
            complete: () => {
                this.logger.log(`State machine complete`);
                console.log(this.currentActor.getSnapshot().output);
                this.dispatchEvent(new Event("machine:complete"));
                this.resumeLastMachine();
            },
        });
    }

    startMachine(machineName: string) {
        this.logger.log(`Starting machine: ${machineName}`);
        this.logger.log(`Machine defs: ${JSON.stringify(machineDefs)}`);

        const machineDef: any = machineDefs[machineName];

        if (!machineDef) {
            this.logger.error(
                `Machine definition not found for ${machineName}`
            );
            throw new Error(`Machine definition not found for ${machineName}`);
        }

        console.log("Current Actor:", this.currentActor);

        if (this.currentActor) {
            //&& !this.currentActor.state.done) {
            this.subscription.unsubscribe();
            const snapshot = this.currentActor.getPersistedSnapshot();
            this.stack.push({
                name: this.currentMachineName,
                actor: this.currentActor,
                snapshot,
            });
            this.dispatchEvent(new Event("machine:pause"));
            this.dispatchEvent(new Event("stack:push"));
            this.logger.log(`Paused and stacked machine: ${machineName}`);
        }

        // CREATE THE NEW MACHINE/ACTOR

        this.currentMachineName = machineName;
        this.currentActor = createActor(machineDef());
        this.initSubscription();

        this.currentActor.on("invoke", (event: any) => {
            this.logger.log(`!!--\\\\ Invoke event: ${event.type} \\\\`);
            this.logger.log(event);
            this.startMachine(event.data);
        });

        this.currentActor.start();
        this.logger.log(`Started new state machine: ${machineName}`);

        const result = {
            name: machineName,
            snapshot: this.currentActor.getPersistedSnapshot(),
        };

        this.dispatchEvent(new Event("machine:start"));
        return result;
    }

    resumeLastMachine() {
        if (this.stack.length > 0) {
            const entry = this.stack.pop();
            if (entry === undefined) {
                this.logger.error(`stack entry undefined`);
                return;
            }
            const { name, actor, snapshot } = entry;
            this.currentMachineName = name;
            this.currentActor = actor;
            // this.currentActor.restore(snapshot);
            this.initSubscription();
            this.logger.log(`Resumed machine from stack`);
            this.dispatchEvent(new Event("stack:pop"));

            const result = {
                name,
                snapshot: this.currentActor.getPersistedSnapshot(),
            };

            this.dispatchEvent(new Event("machine:resume"));
            return result;
        } else {
            this.currentActor = undefined;
            this.subscription.unsubscribe();
            this.dispatchEvent(new Event("stack:empty"));
        }
    }

    sendEvent(event: any) {
        if (this.currentActor) {
            this.currentActor.send(event);
            this.logger.log(`Event sent: ${event.type}`);

            // return this.currentActor.getPersistedSnapshot();
            return {
                name: this.currentMachineName,
                snapshot: this.currentActor.getPersistedSnapshot(),
            };
        }
    }

    getPendingStates() {
        if (this.currentActor) {
            console.log("Getting PENDING STATES:");
            console.log(this.currentActor.getSnapshot());
            console.log(getNextEvents(this.currentActor.getSnapshot()));
            // console.log(this.currentActor.logic);
            return getNextEvents(this.currentActor.getSnapshot());
        }
        return [];
    }

    getSnapshot() {
        if (this.currentActor) {
            return this.currentActor.getPersistedSnapshot();
        }
        return null;
    }

    getMachineNames() {
        return Object.keys(machineDefs);
    }

    getCurrentStateName() {
        const collapse: Function = (obj: any): string[] => {
            const keys = Object.keys(obj);
            const key = keys[0];
            const val = obj[key];
            const result = typeof val === "string" ? [val] : collapse(val);
            return [key, ...result];
        };

        if (this.currentActor) {
            const value = this.currentActor.getSnapshot().value;
            if (typeof value === "string") {
                return [value];
            } else {
                return collapse(value);
            }
        }
        return [];
    }

    getCurrentMachineName() {
        return this.currentMachineName;
    }

    isMachineRunning() {
        return this.currentActor !== undefined;
    }

    getStack() {
        const stack = this.stack.map((entry) => {
            return {
                name: entry.name,
                snapshot: entry.actor.getPersistedSnapshot(),
            };
        });
        return stack;
    }
}
