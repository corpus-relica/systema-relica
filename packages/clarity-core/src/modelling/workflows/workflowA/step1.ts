import { WorkflowStep } from '../../workflow';

class Step1 extends WorkflowStep {
  constructor() {
    super('step1', () => {
      console.log('step1');
    });
  }
}
