import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModellingSession } from './modellingSession.entity';

import { workflowDefs } from './workflows/workflowDefs';
import { stepDefs } from './workflows/stepDefs';
import WorkflowManager from './workflows/workflowManager';

@Injectable()
export class ModellingService {
  private logger: Logger = new Logger('ModellingService');
  private workflows = {};
  private stack: WorkflowManager[] = undefined;
  private context: any = {};
  private tree: any[] = [];

  async onApplicationBootstrap() {
    const state = await this.modelSessionRepository.find({
      where: { uid: 1 },
    });
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
      stack: this.stack?.map((w) => w.id),
      tree: this.tree,
      workflow: manager?.state,
      //TODO: this is a hack; figure a better way to do this
      isComplete: this.stack !== undefined && this.stack.length === 0,
      context: this.context,
    };
  }

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
    this.tree.push([workflowId, this.stack[0].id]);

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

  validateWorkflow() {
    this.stack[0].validate();
  }

  finalizeWorkflow() {
    //presumably this is the last/only workflow in the stack
    this.stack[0].finalize();
    this.stack.shift();
    this.context = {};
    this.tree = [];
  }

  popWorkflow() {
    this.stack.shift();
  }

  setWorkflowValue(key: string, value: any) {
    this.context[key] = value;
  }
}
