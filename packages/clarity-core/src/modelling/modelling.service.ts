import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModellingSession } from './modellingSession.entity';

import { workflowDefs } from './workflows/workflowDefs';
import WorkflowManager from './workflows/workflowManager';
import { createActor, createMachine, assign } from 'xstate';
import { states } from './states';

@Injectable()
export class ModellingService {
  private logger: Logger = new Logger('ModellingService');
  private workflows = {};
  private actor: any;
  private workflow: any;
  // private root: WorkflowManager;
  // private current: WorkflowManager;

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
    // let current = this.current;
    // while (current) {
    //   stack.unshift(current.id);
    //   current = current.parent;
    // }
    return stack;
  }

  getValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    const key = Object.keys(value)[0];
    return this.getValue(value[key]);
  }

  getState() {
    const snapshot = this.actor.getSnapshot();
    const state = this.getStateDef(snapshot.value, this.workflow);
    console.log('State:', state);
    const value = this.getValue(snapshot.value);
    console.log('value', value);
    const s = states[value];
    console.log('Woems issues:', s);

    let nextEvents = [];
    if (state.on) {
      nextEvents = Object.keys(state.on);
      console.log('NextEvents:', nextEvents);
    }
    return {
      nextEvents,
      spec: s,
      // environment: [],
      // stack: this.stack,
      // tree: this.root?.tree,
      // workflow: this.current?.state,
      // //TODO: this is a hack; figure a better way to do this
      // isComplete: false,
      // context: this.current?.context,
      // facts: this.root?.facts,
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
    this.workflow = workflow;
    const workflowSM = createMachine(
      workflow,

      {
        actions: {
          populateContext: assign(({ context, event }) => {
            console.log('ACTION, context:', context, 'event:', event);
            return {
              ...context,
              ...event,
            };
          }),
        },
        actors: {},
        guards: {},
        delays: {},
      },
    );

    const actor = createActor(workflowSM, {});
    actor.subscribe((snapshot) => {
      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
      // console.log('???:', snapshot.nextEvents);
      // const value = this.getValue(snapshot.value);
      console.log('Value:', snapshot.value);
    });
    actor.start();

    this.actor = actor;
    // const manager = new WorkflowManager(workflow);

    // this.root = manager;
    // this.current = manager;

    // return manager.start({ fieldId: null, entity: null });
  }

  async branchWorkflow(fieldId: string, workflowId: string) {
    // const currentManager = this.current;
    // if (currentManager.children[fieldId]) {
    //   this.current = currentManager.children[fieldId];
    // } else {
    //   const workflow = this.workflows[workflowId];
    //   const manager = new WorkflowManager(workflow);
    //   currentManager.children[fieldId] = manager;
    //   manager.parent = currentManager;
    //   this.current = manager;
    //   const fieldDef = currentManager.currentStep.fieldSources.filter(
    //     (field) => field.field === fieldId,
    //   )[0];
    //   const entity = currentManager.context[fieldId];
    //   return this.current.start({ fieldDef, entity });
    // }
  }

  incrementWorkflowStep(event: string) {
    console.log('EVENT:', event);
    return this.actor.send({ type: event });
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
    // this.context[key] = value;
    // this.current.setContext(key, { uid: null, value });
  }

  setWorkflowKGValue(key: string, uid: number, value: any) {
    // this.context[key] = value;
    // this.current.setContext(key, { uid, value });
  }
}
