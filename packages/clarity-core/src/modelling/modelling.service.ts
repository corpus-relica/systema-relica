import { Fact } from '@relica/types';
import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModellingSession } from './modellingSession.entity';

import { workflowDefs } from './workflows/workflowDefs';
import WorkflowManager from './workflows/workflowManager';
import { createActor, createMachine, assign } from 'xstate';
import * as _ from 'lodash';
import TempUIDManager from './workflows/UIDManager';

@Injectable()
export class ModellingService {
  private logger: Logger = new Logger('ModellingService');
  private workflows = {};

  private current: WorkflowManager;

  private allManagers: WorkflowManager[] = [];
  private _stack = [];
  private _fieldMapStack = [];

  // private _facts: Record<string, Fact[]> = {};

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

  // get facts() {
  //   return this._facts;
  // }

  getState() {
    return {
      nextEvents: this.current.nextEvents,
      spec: this.current.spec,
      facts: [
        ...this.allManagers.map((m) => m.facts).flat(),
        ...this.current.pendingFacts,
      ],
      // context: this.context,
      context: this.current.context,
    };
  }

  async getWorkflows() {
    return this.workflows;
  }

  getStateDef(state: string | Record<string, string | any>, workflow: any) {
    if (typeof state === 'string') {
      return workflow.states[state];
    } else {
      const key = Object.keys(state)[0];
      return this.getStateDef(state[key], workflow.states[key]);
    }
  }

  async initWorkflow(workflowId: string) {
    const workflow = this.workflows[workflowId];
    const foo = new WorkflowManager(
      workflow,
      this.branchWorkflow.bind(this),
      this.endWorkflow.bind(this),
    );
    foo.start();
    this.current = foo;
    this.allManagers.push(foo);
  }

  async branchWorkflow(fieldMap: string[], workflowId: string) {
    // const currentManager = this.current;
    // if (currentManager.children[fieldId]) {
    //   this.current = currentManager.children[fieldId];
    // } else {
    const workflow = this.workflows[workflowId];
    console.log('WORKFLOW:', workflow);

    this._fieldMapStack.push(fieldMap);
    this._stack.push(this.current);

    this.initWorkflow(workflowId);
  }

  async endWorkflow() {
    if (this._stack.length === 0) {
      console.log('NO MORE WORKFLOWS !!!!!');
      return;
    }

    const fieldMap = this._fieldMapStack.pop();
    const val = this.current.getContext(fieldMap[1]);
    console.log(
      'MMMMMMUUUUUUUUUUUUUUTTTTTTTTTTTTTTTHHHHHHHHHHHHHHEEEEEEERRRRRRFFFFFFFFFFFFFUUUUUUUUUUUUCCCCCCCCCCCCCCKKKKKKKKKKKKKK',
      val,
    );
    this.current = this._stack.pop();
    this.current.setContext(fieldMap[0], val);
  }

  incrementWorkflowStep(event: string) {
    this.current.send(event);
  }

  decrementWorkflowStep() {
    // return this.current.prev();
  }

  validateWorkflow() {
    // this.current.validate();
  }

  finalizeWorkflow() {
    //presumably this is the last/only workflow in the stack
    // this.root.finalize();
    // this.stack.shift();
    // this.context = {};
    // this.tree = [];
  }

  popWorkflow() {
    // this.stack.shift();
    // if (this.current.parent) {
    //   this.current = this.current.parent;
    // }
  }

  setWorkflowValue(key: string, value: any) {
    this.current.setContextValue(key, value);
  }

  setWorkflowKGValue(key: string, uid: number, value: any) {
    // console.log('SETTING KG VALUE', key, uid, value);
    // this.context[key] = { uid, value };

    this.current.setContext(key, { uid, value });
  }
}
