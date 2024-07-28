export class WorkflowStep {
  constructor(
    public readonly id: string,
    public readonly action: () => void,
    public readonly subWorkflows: Workflow[] = [],
  ) {}

  validate(): Boolean {
    return true;
  }
}

export class Workflow {
  constructor(
    public readonly id: string,
    public readonly steps: WorkflowStep[],
  ) {}
}

export class WorkflowStack {
  private stack: Workflow[] = [];

  push(workflow: Workflow): void {
    this.stack.push(workflow);
  }

  pop(): Workflow | undefined {
    return this.stack.pop();
  }

  peek(): Workflow | undefined {
    return this.stack[this.stack.length - 1];
  }

  isEmpty(): boolean {
    return this.stack.length === 0;
  }
}
