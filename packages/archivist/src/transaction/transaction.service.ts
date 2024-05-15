import { Injectable } from '@nestjs/common';
import { createMachine, createActor } from 'xstate';
import HSMManager from '@relica/hsm-manager';

@Injectable()
export class TransactionService {
    private hsmManager: HSMManager;

    constructor() {
        this.hsmManager = new HSMManager();
    }

    startMachine(machineName: string) {
        this.hsmManager.startMachine(machineName);
    }

    resumeLastMachine() {
        this.hsmManager.resumeLastMachine();
    }

    sendEvent(event: any) {
        this.hsmManager.sendEvent(event);
    }

    getPendingStates() {
        return this.hsmManager.getPendingStates();
    }
}
