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
  //
  private manager: WorkflowManager;
  private stack: WorkflowManager[] = [];

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
    return {
      environment: [],
      stack: this.stack.map((w) => w.id),
      tree: [],
      workflow: this.manager?.def,
      currentStep: this.manager?.currentStep, //,
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

    const workflowManager = new WorkflowManager(workflow);
    this.manager = workflowManager;

    return this.manager.start();
  }

  async branchWorkflow(workflowId: string) {
    console.log('BRANCHING WORKFLOW');
    console.log(workflowId);

    const workflow = this.workflows[workflowId];

    const workflowManager = new WorkflowManager(workflow);

    this.stack.push(this.manager);
    this.manager = workflowManager;

    return this.manager.start();
  }

  incrementWorkflowStep() {
    return this.manager.next();
  }

  decrementWorkflowStep() {
    return this.manager.prev();
  }
}
