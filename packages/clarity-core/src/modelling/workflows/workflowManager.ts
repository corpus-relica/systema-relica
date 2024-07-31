import { Fact } from '@relica/types';
import { stepDefs } from './stepDefs';

class WorkflowManager {
  private _def: any = {};
  private currStepIdx: number = 0;
  private currStepDef: any = {};

  constructor(def: any) {
    this._def = Object.assign({}, def);
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

  get isFinalStep() {
    return this.currStepIdx === this.def.steps.length - 1;
  }

  get state() {
    return {
      id: this.id,
      currentStep: this.currentStep,
      isFinalStep: this.isFinalStep,
    };
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
