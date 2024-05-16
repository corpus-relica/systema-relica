import type { AnyMachineSnapshot } from "xstate";
import { createActor /*ActorRef*/ } from "xstate";
import machineDefs from "./hsm-definitions";
// import { SharedLogger } from "./utils/logging";

interface StackItem {
    actor: any;
    snapshot: any;
}

//see: https://stately.ai/docs/migration#statenextevents-has-been-removed
function getNextEvents(snapshot: AnyMachineSnapshot) {
    return [
        ...new Set([...snapshot._nodes.flatMap((sn: any) => sn.ownEvents)]),
    ];
}

export class HSMManager {
    private stack: StackItem[] = [];
    private currentActor: any; //ActorRef<any> | null = null;
    private logger: any; //SharedLogger;

    constructor() {
        this.logger = console;
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

        if (this.currentActor && !this.currentActor.state.done) {
            const snapshot = this.currentActor.getPersistedSnapshot();
            this.stack.push({ actor: this.currentActor, snapshot });
            this.logger.log(`Paused and stacked machine: ${machineName}`);
        }

        this.currentActor = createActor(machineDef());
        this.currentActor.subscribe(this.handleStateChange.bind(this));
        this.currentActor.start();
        this.logger.log(`Started new state machine: ${machineName}`);

        return this.currentActor.getPersistedSnapshot();
    }

    resumeLastMachine() {
        if (this.stack.length > 0) {
            const entry = this.stack.pop();
            if (entry === undefined) {
                this.logger.error(`stack entry undefined`);
                return;
            }
            const { actor, snapshot } = entry;
            this.currentActor = actor;
            this.currentActor.restore(snapshot);
            this.currentActor.subscribe(this.handleStateChange.bind(this));
            this.logger.log(`Resumed machine from stack`);

            return this.currentActor.getPersistedSnapshot();
        } else {
            this.logger.error(`No machines left in stack to resume`);
        }
    }

    handleStateChange(snapshot: any) {
        this.logger.log(`State changed to: ${JSON.stringify(snapshot.value)}`);
        // Additional logic can go here
        return snapshot;
    }

    sendEvent(event: any) {
        if (this.currentActor) {
            this.currentActor.send(event);
            this.logger.log(`Event sent: ${event.type}`);

            return this.currentActor.getPersistedSnapshot();
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
}
