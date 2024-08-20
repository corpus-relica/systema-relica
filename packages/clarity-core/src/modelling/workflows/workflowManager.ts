import { Fact } from '@relica/types';
import { stepDefs } from './stepDefs';
import TempUIDManager from './UIDManager';
import { createActor, createMachine, assign } from 'xstate';
import { states } from '../states';

import * as _ from 'lodash';

const omitEmptyValues = (obj) => {
  return _.omitBy(obj, (value) => _.isNil(value) || value === '');
};

export enum WorkflowStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

const emptyFactsP = (facts: Fact[]): boolean => {
  // check if all facts have empty lh_object_uid or rh_object_uid and lh_object_name or rh_object_name
  // return true if all facts are empty
  // return false if any fact is not empty
  return facts.every((fact) => {
    return (
      // fact.lh_object_uid === '' &&
      fact.lh_object_name === '' &&
      // fact.rh_object_uid === '' &&
      fact.rh_object_name === ''
    );
  });
};

const completeFactsP = (facts: Fact[]): boolean => {
  // check if all facts have non-empty lh_object_uid and rh_object_uid and lh_object_name and rh_object_name
  // return true if all facts are complete
  // return false if any fact is not complete
  return facts.every((fact) => {
    return (
      // fact.lh_object_uid !== '' &&
      fact.lh_object_name !== '' &&
      // fact.rh_object_uid !== '' &&
      fact.rh_object_name !== ''
    );
  });
};

const someCompleteFactsP = (facts: Fact[]): boolean => {
  // check if any fact has non-empty lh_object_uid and rh_object_uid and lh_object_name and rh_object_name
  // return true if any fact is complete
  // return false if all facts are empty
  return facts.some((fact) => {
    return (
      // fact.lh_object_uid !== '' &&
      fact.lh_object_name !== '' &&
      // fact.rh_object_uid !== '' &&
      fact.rh_object_name !== ''
    );
  });
};

const getValue = (value) => {
  if (typeof value === 'string') {
    return value;
  }
  const key = Object.keys(value)[0];
  return getValue(value[key]);
};

const getStateDef = (
  state: string | Record<string, string | any>,
  workflow: any,
) => {
  if (typeof state === 'string') {
    return workflow.states[state];
  } else {
    const key = Object.keys(state)[0];
    return getStateDef(state[key], workflow.states[key]);
  }
};

const isTempUID = (uid: number) => uid >= 0 && uid <= 99;

class WorkflowManager {
  private _id: number;
  private _def: any = {};
  private _context: any = {};

  private currStepIdx: number = 0;
  private currStepDef: any = {};
  private status: WorkflowStatus = WorkflowStatus.NOT_STARTED;

  private _parent: WorkflowManager | null = null;
  private _children: Record<string, WorkflowManager> = {};

  private _smdef: any = {};
  private _sm: any = null;
  private _actor: any = null;

  private _facts: Record<string, Fact[]> = {};
  private _pendingFacts: Fact[] = [];

  constructor(smdef: any, branchWorkflow: any, endWorkflow: any) {
    this._id = Math.floor(10000 + Math.random() * 90000);
    // this._def = Object.assign({}, def);
    this._smdef = smdef;
    this._sm = createMachine(smdef, {
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

    this._actor = createActor(this._sm, {});

    this._actor.subscribe((snapshot) => {
      console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
      if (snapshot.value === 'END') {
        console.log('END OF WORKFLOW');
        endWorkflow();
        return;
      }
      console.log('Value:', snapshot.value);
      const state = getStateDef(snapshot.value, this._smdef);
      console.log('STATE:', state.id);

      if (state.entry) {
        branchWorkflow(
          state.entry.params.fieldMap.split(':'),
          state.entry.params.workflowId,
        );
      }
    });
  }

  //

  //

  get nextEvents() {
    const snapshot = this._actor.getSnapshot();
    const state = getStateDef(snapshot.value, this._smdef);
    const value = getValue(snapshot.value);

    let nextEvents = [];
    if (state.on) {
      nextEvents = Object.keys(state.on);
    }
    return nextEvents;
  }

  get spec() {
    const snapshot = this._actor.getSnapshot();
    console.log('SNAPSHOT');
    const value = getValue(snapshot.value);
    console.log('SNAPSHOT VALUE', value);
    console.log('SNAPSHOT ID', this._smdef.id);
    // console.log('SNAPSHOT STATES', states.length);
    const spec = states[this._smdef.id][value];
    // console.log('SNAPSHOT SPEC', spec);

    return spec;
  }

  //

  get id() {
    return this._id + ':' + this._def.id;
  }

  get def() {
    return this._def;
  }

  get currentStep() {
    return this.currStepDef;
  }

  get isFinalStep() {
    return this.currStepIdx === this.def.steps.length - 1;
  }

  get isRequiredStep() {
    return this.def.steps[this.currStepIdx].required;
  }

  get state() {
    return {
      id: this.id,
      currentStep: this.currentStep,
      isFinalStep: this.isFinalStep,
      status: this.status,
    };
  }

  get steps() {
    return this.def.steps;
  }

  get tree() {
    // depth-first traversal
    // tree is array of tuples: [childId, parentId]
    // root node has parentId = null
    const tree = [];
    const stack: WorkflowManager[] = [this];
    while (stack.length > 0) {
      const node: WorkflowManager = stack.pop();
      for (const childId in node.children) {
        tree.push([node.children[childId].id, node.id]);
        stack.push(node.children[childId]);
      }
    }
    return tree;
  }

  get context() {
    return this._context;
  }

  get parent() {
    return this._parent;
  }

  set parent(parent: WorkflowManager) {
    this._parent = parent;
  }

  get children() {
    return this._children;
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
    const snapshot = this._actor.getSnapshot();
    const state = getStateDef(snapshot.value, this._smdef);
    const value = getValue(snapshot.value);
    const spec = this.spec;
    if (spec) {
      const pattern: string[] = spec.create;
      const f = this.fuckit(pattern);
      return f;
    }
    return [];
  }

  get facts() {
    return Object.values(this._facts).reduce((acc, facts) => {
      return [...acc, ...facts];
    }, []);
  }

  //

  areAllFieldsValid() {
    // Check if all required fields are filled and valid
    return true;
  }

  //
  start(linkedField?: any) {
    this._actor.start();
    // const { fieldDef, entity } = linkedField;
    // const thatFieldId = fieldDef?.thatField;
    // this.currStepIdx = 0;
    // this.currStepDef = stepDefs[this.def.steps[this.currStepIdx].id];
    // this.status = WorkflowStatus.IN_PROGRESS;
    // Object.entries(stepDefs).forEach(([key, val]) => {
    //   val.fieldSources.forEach((field: any) => {
    //     if (!this._context[field.field]) {
    //       if (field.field === thatFieldId) {
    //         this._context[field.field] = entity;
    //       } else {
    //         const uid = TempUIDManager.getNextUID();
    //         this._context[field.field] = {
    //           uid,
    //           value: '',
    //         };
    //       }
    //     }
    //   });
    // });
    // return this.currStepDef;
  }

  send(event: string) {
    if (event === 'NEXT') {
      console.log(
        'SENDING NEXT ##################-----------------------------------------------------------------------------> ',
        this.spec.id,
      );
      this._facts[this.spec.id] = this.pendingFacts;
    }
    return this._actor.send({ type: event });
  }

  next() {
    // this.currStepIdx++;
    // this.currStepDef = stepDefs[this.def.steps[this.currStepIdx].id];
    // return this.currStepDef;
  }

  prev() {
    if (this.currStepIdx === 0) return this.currStepDef;
    this.currStepIdx--;
    this.currStepDef = stepDefs[this.def.steps[this.currStepIdx].id];
    return this.currStepDef;
  }

  validate() {
    // Check if all required fields are filled and valid
    if (this.areAllFieldsValid()) {
      this.status = WorkflowStatus.PENDING;
    } else {
      throw new Error(
        'All required fields must be valid to validate the workflow',
      );
    }
  }

  finalize() {
    if (this.status !== WorkflowStatus.PENDING) {
      throw new Error("Workflow must be in 'pending' status to finalize");
    }
    // Perform final actions (e.g., inserting into knowledge graph)
    this.status = WorkflowStatus.COMPLETED;
  }

  //

  setContext(key: string, value: { uid: number; value: string }) {
    console.log('SETTING CONTEXT', this.id, key, value);
    if (!this._context[key]) {
      this._context[key] = value;
    } else {
      if (value.uid) {
        this._context[key].uid = value.uid;
      }
      if (value.value) {
        this._context[key].value = value.value;
      }
    }
  }

  setContextValue(key: string, value: string) {
    console.log('SETTING CONTEXT VALUE', this.id, key, value);
    if (this._context[key]) {
      this._context[key].value = value;
    } else {
      this._context[key] = { uid: TempUIDManager.getNextUID(), value };
    }
  }

  getContext(key: string) {
    if (this._context[key]) {
      return this._context[key];
    }
    return null;
  }
}

export default WorkflowManager;
