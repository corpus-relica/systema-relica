import { Injectable } from '@nestjs/common';
import { createMachine, createActor } from 'xstate';
import { createPhysObjDefinitionSpec } from './specs/createPhysObjDefinitionSpec';
import { HSMManager } from '@relica/shared';

const machineDefs = {
    'Physical Object Definition': createPhysObjDefinitionSpec,
};

@Injectable()
export class TransactionService {
    stack: any[] = [];
    actor = null;
    stateSub = null;

    constructor() {
        const foo = HSMManager;
    }

    startMachine(machineName: string) {
        const machineDef = machineDefs[machineName];
        if (!machineDef) {
            throw new Error(`Machine definition not found for ${machineName}`);
            return;
        }

        // Pause current state machine and push its state to stack
        if (this.actor && !this.actor.state.done) {
            const snapshot = this.actor.getPersistedSnapshot();
            this.stack.push({ actor: this.actor, snapshot });
            if (this.stateSub) {
                this.stateSub.unsubscribe();
            }
        }

        // Create a new state machine
        this.actor = createActor(createMachine(machineDef));

        // Subscribe to state changes
        this.stateSub = this.actor.subscribe(this.handleStateChange.bind(this));

        // Start the actor
        this.actor.start();
    }

    resumeLastMachine() {
        if (this.stack.length > 0) {
            const { actor, snapshot } = this.stack.pop();
            this.actor = actor;
            this.actor.restore(snapshot);
            this.stateSub = this.actor.subscribe(
                this.handleStateChange.bind(this),
            );
        }
    }

    handleStateChange(snapshot) {
        console.log(snapshot);

        // Check if this state transition requires a new state machine
        if (snapshot.event.type === 'SPECIAL_TRANSITION') {
            this.startMachine('NewMachineName'); // Replace with the actual machine to start
        }
    }

    sendEvent(event: any) {
        if (this.actor) {
            this.actor.send(event);
        }
    }

    getPendingStates() {
        if (this.actor) {
            return this.actor.state.nextEvents;
        }
        return [];
    }
}
