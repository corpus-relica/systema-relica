import { Fact } from '@relica/types';
import { stepDefs } from './stepDefs';
import TempUIDManager from './UIDManager';

export enum WorkflowStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

class WorkflowManager {
  private _id: number;
  private _def: any = {};
  private _context: any = {};

  private currStepIdx: number = 0;
  private currStepDef: any = {};
  private status: WorkflowStatus = WorkflowStatus.NOT_STARTED;

  private _parent: WorkflowManager | null = null;
  private _children: Record<string, WorkflowManager> = {};

  constructor(def: any) {
    this._id = Math.floor(10000 + Math.random() * 90000);
    this._def = Object.assign({}, def);
  }

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
    if (this._parent) {
      return Object.assign({}, this._parent.context, this._context);
    }
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

      let lh_object_uid = parts[0][0];
      let lh_object_name = parts[0][1];
      let rh_object_uid = parts[2][0];
      let rh_object_name = parts[2][1];

      if (lh_object_uid === '?') {
        // console.log('THIS ID', this.id);
        const lh_object = this.getContext(lh_object_name);
        // console.log('THIS LH OBJ', lh_object);
        lh_object_uid = lh_object?.uid;
        lh_object_name = lh_object?.value;
      }

      if (rh_object_uid === '?') {
        // console.log('THIS ID', this.id);
        const rh_object = this.getContext(rh_object_name);
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

      facts.push(fact);
    });

    console.log('FACTS', facts);
    return facts;
  }

  get facts() {
    // gather facts from all steps, recursing through children
    const facts: Fact[] = [];
    // const stack: WorkflowManager[] = [this];
    // while (stack.length > 0) {
    // const node: WorkflowManager = stack.pop();
    for (const stepId of this.steps) {
      const f = this.fuckit(stepDefs[stepId].pattern);
      facts.push(...f);
    }
    for (const childId in this.children) {
      facts.push(...this.children[childId].facts);
    }
    // }

    return facts;
  }

  //

  areAllFieldsValid() {
    // Check if all required fields are filled and valid
    return true;
  }

  //
  start() {
    this.currStepIdx = 0;
    this.currStepDef = stepDefs[this.def.steps[this.currStepIdx]];
    this.status = WorkflowStatus.IN_PROGRESS;

    Object.entries(stepDefs).forEach(([key, val]) => {
      val.fieldSources.forEach((field: any) => {
        // this._context[field.field] = 'foobarbaz';

        console.log('FUCKING INCREMENT TEMP UID......');
        this._context[field.field] = {
          uid: TempUIDManager.getNextUID(),
          value: '',
        };
      });
    });

    return this.currStepDef;
  }

  next() {
    this.currStepIdx++;
    this.currStepDef = stepDefs[this.def.steps[this.currStepIdx]];
    return this.currStepDef;
  }

  prev() {
    if (this.currStepIdx === 0) return this.currStepDef;
    this.currStepIdx--;
    this.currStepDef = stepDefs[this.def.steps[this.currStepIdx]];
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

  setContext(key: string, value: any) {
    console.log('SETTING CONTEXT', this.id, key, value);
    this._context[key].value = value;
  }

  getContext(key: string) {
    console.log('GETTING CONTEXT', this.id, key, this._context);
    if (this._context[key]) {
      return this._context[key];
    }
    if (this._parent) {
      return this._parent.getContext(key);
    }
    return null;
  }
}

export default WorkflowManager;
