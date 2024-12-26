import { Injectable } from '@nestjs/common';
import { createMachine, createActor } from 'xstate';
import { HSMManager } from '@relica/hsm-manager';

@Injectable()
export class TransactionService {
  private hsmManager: HSMManager;

  constructor() {
    this.hsmManager = new HSMManager();
  }

  startMachine(machineName: string) {
    return this.hsmManager.startMachine(machineName);
  }

  resumeLastMachine() {
    return this.hsmManager.resumeLastMachine();
  }

  sendEvent(event: any) {
    return this.hsmManager.sendEvent(event);
  }

  getSnapshot() {
    return this.hsmManager.getSnapshot();
  }

  getPendingStates() {
    return this.hsmManager.getPendingStates();
  }
}
