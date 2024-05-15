"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const xstate_1 = require("xstate");
const hsm_definitions_1 = __importDefault(require("./hsm-definitions"));
function getNextEvents(snapshot) {
    return [...new Set([...snapshot._nodes.flatMap((sn) => sn.ownEvents)])];
}
class HSMManager {
    constructor() {
        this.stack = [];
        this.logger = console;
    }
    startMachine(machineName) {
        this.logger.log(`Starting machine: ${machineName}`);
        this.logger.log(`Machine defs: ${JSON.stringify(hsm_definitions_1.default)}`);
        const machineDef = hsm_definitions_1.default[machineName];
        if (!machineDef) {
            this.logger.error(`Machine definition not found for ${machineName}`);
            throw new Error(`Machine definition not found for ${machineName}`);
        }
        if (this.currentActor && !this.currentActor.state.done) {
            const snapshot = this.currentActor.getPersistedSnapshot();
            this.stack.push({ actor: this.currentActor, snapshot });
            this.logger.log(`Paused and stacked machine: ${machineName}`);
        }
        this.currentActor = (0, xstate_1.createActor)(machineDef());
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
        }
        else {
            this.logger.error(`No machines left in stack to resume`);
        }
    }
    handleStateChange(snapshot) {
        this.logger.log(`State changed to: ${JSON.stringify(snapshot.value)}`);
        // Additional logic can go here
        return snapshot;
    }
    sendEvent(event) {
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
}
exports.default = HSMManager;
