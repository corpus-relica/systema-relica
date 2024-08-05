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
  private root: WorkflowManager;
  private current: WorkflowManager;

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

  get stack() {
    const stack = [];
    let current = this.current;
    while (current) {
      stack.unshift(current.id);
      current = current.parent;
    }
    return stack;
  }

  getState() {
    return {
      environment: [],
      stack: this.stack,
      tree: this.root?.tree,
      workflow: this.current?.state,
      //TODO: this is a hack; figure a better way to do this
      isComplete: false,
      context: this.current?.context,
      facts: this.root?.facts,
    };
  }

  async getWorkflows() {
    return this.workflows;
  }

  async initWorkflow(workflowId: string) {
    const workflow = this.workflows[workflowId];
    const manager = new WorkflowManager(workflow);

    this.root = manager;
    this.current = manager;

    return manager.start();
  }

  async branchWorkflow(fieldId: string, workflowId: string) {
    console.log('BRANCHING WORKFLOW');
    console.log(fieldId, workflowId);

    const currentManager = this.current;
    if (currentManager.children[fieldId]) {
      this.current = currentManager.children[fieldId];
      return this.current.start();
    } else {
      const workflow = this.workflows[workflowId];
      const manager = new WorkflowManager(workflow);
      currentManager.children[fieldId] = manager;
      manager.parent = currentManager;
      this.current = manager;
      return this.current.start();
    }
  }

  incrementWorkflowStep() {
    return this.current.next();
  }

  decrementWorkflowStep() {
    return this.current.prev();
  }

  validateWorkflow() {
    this.current.validate();
  }

  finalizeWorkflow() {
    //presumably this is the last/only workflow in the stack
    this.root.finalize();

    // this.stack.shift();
    // this.context = {};
    // this.tree = [];
  }

  popWorkflow() {
    // this.stack.shift();
    if (this.current.parent) {
      this.current = this.current.parent;
    }
  }

  setWorkflowValue(key: string, value: any) {
    // this.context[key] = value;
  }
}
