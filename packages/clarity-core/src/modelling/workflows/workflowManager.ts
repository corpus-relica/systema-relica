import { Fact } from '@relica/types';
import { stepDefs } from './stepDefs';

class WorkflowManager {
  private _def: any = {};
  private currStepIdx: number = 0;
  private currStepDef: any = {};
  private context: Fact[] = [];

  constructor(def: any) {
    this._def = def;
  }

  get id() {
    return this._def.id;
  }

  get def() {
    return this._def;
  }

  get currentStep() {
    return this.currStepDef;
  }

  start() {
    this.currStepIdx = 0;
    this.currStepDef = stepDefs[this.def.steps[this.currStepIdx]];
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

  getSteps() {
    return this.def.steps;
  }
}

export default WorkflowManager;
