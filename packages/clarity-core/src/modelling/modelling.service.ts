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
import { states } from './states';
import * as _ from 'lodash';
import TempUIDManager from './workflows/UIDManager';

const isTempUID = (uid: number) => uid >= 0 && uid <= 99;

@Injectable()
export class ModellingService {
  private logger: Logger = new Logger('ModellingService');
  private workflows = {};
  private actor: any;
  private workflow: any;
  // private root: WorkflowManager;
  // private current: WorkflowManager;
  private context = {};
  private stack = [];

  private _facts = [];

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

  getValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    const key = Object.keys(value)[0];
    return this.getValue(value[key]);
  }

  get facts() {
    return this._facts;
  }

  fuckit(pattern) {
    const facts = [];
    pattern.forEach((expression) => {
      if (expression.startsWith('@')) return;

      const parts = expression
        .split('>')
        .map((e: string) => e.trim())
        .map((e: string) => {
          const [id, name] = e.split('.');
          const newName =
            name.endsWith('*') || name.endsWith('+')
              ? name.substring(0, name.length - 1)
              : name;
          // console.log('NEW NAME -- ', newName);
          return [id, newName];
        });
      console.log('PARS', parts);

      let lh_object_uid = parts[0][0];
      let lh_object_name = parts[0][1];
      let rh_object_uid = parts[2][0];
      let rh_object_name = parts[2][1];

      // if (lh_object_name.endsWith('?')) {
      if (isTempUID(lh_object_uid)) {
        // console.log('THIS ID', this.id);
        const lh_object = this.context[_.trimEnd(lh_object_name, '?')];
        // console.log('THIS LH OBJ', lh_object);
        lh_object_uid = lh_object?.uid;
        lh_object_name = lh_object?.value;
      }

      // if (rh_object_name.endsWith('?')) {
      if (isTempUID(rh_object_uid)) {
        // console.log('THIS ID', this.id);
        const rh_object = this.context[_.trimEnd(rh_object_name, '?')];
        // console.log('THIS RH OBJ', rh_object);
        rh_object_uid = rh_object?.uid;
        rh_object_name = rh_object?.value;
      }

      const fact: Fact = {
        fact_uid: 1,
        lh_object_uid,
        lh_object_name,
        rel_type_uid: parts[1][0],
        rel_type_name: parts[1][1],
        rh_object_uid,
        rh_object_name,
      };

      if (
        fact.lh_object_name &&
        fact.lh_object_uid &&
        fact.rel_type_name &&
        fact.rel_type_uid &&
        fact.rh_object_name &&
        fact.rh_object_uid
      ) {
        facts.push(fact);
      }
    });

    // console.log('FACTS', facts);
    return facts;
  }

  get pendingFacts() {
    const snapshot = this.actor.getSnapshot();
    const state = this.getStateDef(snapshot.value, this.workflow);
    const value = this.getValue(snapshot.value);
    const spec = states[value];
    if (spec) {
      const pattern: string[] = spec.create;
      const f = this.fuckit(pattern);
      return f;
    }
    return [];
  }

  getState() {
    const snapshot = this.actor.getSnapshot();
    const state = this.getStateDef(snapshot.value, this.workflow);
    const value = this.getValue(snapshot.value);
    const spec = states[value];

    let nextEvents = [];
    if (state.on) {
      nextEvents = Object.keys(state.on);
    }

    return {
      nextEvents,
      spec,
      facts: [...this._facts, ...this.pendingFacts],
      // environment: [],
      // stack: this.stack,
      // tree: this.root?.tree,
      // workflow: this.current?.state,
      // //TODO: this is a hack; figure a better way to do this
      // isComplete: false,
      context: this.context,
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
    const workflowSM = createMachine(workflow, {
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
    });

    const actor = createActor(workflowSM, {});
    actor.subscribe((snapshot) => {
      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
      // console.log('???:', snapshot.nextEvents);
      // const value = this.getValue(snapshot.value);
      console.log('Value:', snapshot.value);
      // console.log(
      //   'snapshot',
      //   //@ts-ignore
      //   snapshot.machine.root.config.states[snapshot.value],
      // );

      const state = this.getStateDef(snapshot.value, this.workflow);
      console.log('STATE:', state);
      if (state.entry) {
        console.log('ENTRY:', state.entry);
        this.branchWorkflow(
          state.entry.params.fieldId,
          state.entry.params.workflowId,
        );
      }
    });
    actor.start();

    this.actor = actor;
  }

  async branchWorkflow(fieldId: string, workflowId: string) {
    // const currentManager = this.current;
    // if (currentManager.children[fieldId]) {
    //   this.current = currentManager.children[fieldId];
    // } else {
    const workflow = this.workflows[workflowId];
    console.log('WORKFLOW:', workflow);
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
    if (event === 'NEXT') {
      this._facts = [...this._facts, ...this.pendingFacts];
    }
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
    const uid = TempUIDManager.getNextUID();

    if (!this.context[key]) this.context[key] = { uid: uid, value: null };
    this.context[key].value = value;
  }

  setWorkflowKGValue(key: string, uid: number, value: any) {
    console.log('SETTING KG VALUE', key, uid, value);
    this.context[key] = { uid, value };
  }
}
