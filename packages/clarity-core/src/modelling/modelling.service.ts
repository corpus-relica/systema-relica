import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModellingSession } from './modellingSession.entity';

import { workflowDefs } from './workflows/workflowDefs';
import { stepDefs } from './workflows/stepDefs';
import WorkflowManager from './workflows/workflowManager';

// export enum State {
//   REVIEW = 'REVIEW',
//   MODELLING = 'MODELLING',
//   SIMULATION = 'SIMULATION',
//   ANALYSIS = 'ANALYSIS',
// }

@Injectable()
export class ModellingService {
  private logger: Logger = new Logger('ModellingService');
  // private state: any = { mainstate: State.REVIEW };
  private workflows = {};
  private stack: WorkflowManager[] = undefined;
  private context: any = {};

  async onApplicationBootstrap() {
    const state = await this.modelSessionRepository.find({
      where: { uid: 1 },
    });
    // this.state = state[0].state;
  }

  constructor(
    @InjectRepository(ModellingSession)
    private modelSessionRepository: Repository<ModellingSession>,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.workflows = workflowDefs;
  }

  getState() {
    const manager = this.stack && this.stack[0];
    return {
      environment: [],
      stack: this.stack.map((w) => w.id),
      tree: [],
      workflow: manager?.state,
      // currentStep: manager?.currentStep, //,
      // isFinalStep: manager?.isFinalStep,
      isComplete: this.stack !== undefined && this.stack.length === 0,
      context: this.context,
    };
  }

  // async setState(newState: State) {
  //   this.state.mainstate = newState;

  //   const modelSession = await this.modelSessionRepository.find({
  //     where: { uid: 1 },
  //   });

  //   // this.eventEmitter.emit('emit', {
  //   //   type: 'system:stateChanged',
  //   //   payload: this.state,
  //   // });
  // }

  async getWorkflows() {
    return this.workflows;
  }

  async initWorkflow(workflowId: string) {
    const workflow = this.workflows[workflowId];

    const manager = new WorkflowManager(workflow);

    this.stack = [manager];

    return manager.start();
  }

  async branchWorkflow(workflowId: string) {
    console.log('BRANCHING WORKFLOW');
    console.log(workflowId);

    const workflow = this.workflows[workflowId];

    const manager = new WorkflowManager(workflow);

    this.stack.unshift(manager);

    return manager.start();
  }

  incrementWorkflowStep() {
    return this.stack[0].next();
  }

  decrementWorkflowStep() {
    return this.stack[0].prev();
  }

  commitWorkflow() {
    // this.manager.commit();
    this.stack.shift();
  }

  setWorkflowValue(key: string, value: any) {
    this.context[key] = value;
  }
}
