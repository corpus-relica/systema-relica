import { Fact } from '@relica/types';
import { stepDefs } from './stepDefs';

export enum WorkflowStatus {
  NOT_STARTED = 'not-started',
  IN_PROGRESS = 'in-progress',
  PENDING = 'pending',
  COMPLETED = 'completed',
}

class WorkflowManager {
  private _id: number;
  private _def: any = {};
  private _context: any = { foo: 'bar' };

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

  get facts() {
    // gather facts from all steps, recursing through children
    const facts: Fact[] = [];
    const stack: WorkflowManager[] = [this];
    while (stack.length > 0) {
      const node: WorkflowManager = stack.pop();
      for (const stepId of node.steps) {
        facts.push(stepDefs[stepId].facts);
      }
      for (const childId in node.children) {
        stack.push(node.children[childId]);
      }
    }
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
}

export default WorkflowManager;
