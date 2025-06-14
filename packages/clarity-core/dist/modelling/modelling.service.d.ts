import { Repository } from 'typeorm';
import { ModellingSession } from './modellingSession.entity';
export declare class ModellingService {
    private modelSessionRepository;
    private logger;
    private workflows;
    private root;
    private current;
    onApplicationBootstrap(): Promise<void>;
    constructor(modelSessionRepository: Repository<ModellingSession>);
    get stack(): any[];
    getState(): {
        environment: any[];
        stack: any[];
        tree: any[];
        workflow: {
            id: string;
            currentStep: any;
            isFinalStep: boolean;
            status: import("./workflows/workflowManager").WorkflowStatus;
        };
        isComplete: boolean;
        context: any;
        facts: unknown[];
    };
    getWorkflows(): Promise<{}>;
    initWorkflow(workflowId: string): Promise<any>;
    branchWorkflow(fieldId: string, workflowId: string): Promise<any>;
    incrementWorkflowStep(): any;
    decrementWorkflowStep(): any;
    validateWorkflow(): void;
    finalizeWorkflow(): void;
    popWorkflow(): void;
    setWorkflowValue(key: string, value: any): void;
    setWorkflowKGValue(key: string, uid: number, value: any): void;
}
