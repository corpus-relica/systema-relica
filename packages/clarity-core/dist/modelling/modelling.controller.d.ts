import { ModellingService } from './modelling.service';
export declare class ModellingController {
    private readonly modelling;
    private readonly logger;
    constructor(modelling: ModellingService);
    workflows(): Promise<any>;
    state(): Promise<any>;
    initWorkflow(workflowId: string): Promise<any>;
    branchWorkflow(fieldId: string, workflowId: string): Promise<any>;
    incrementWorkflowStep(workflowId: string): Promise<any>;
    decrementWorkflowStep(workflowId: string): Promise<any>;
    validateWorkflow(): Promise<any>;
    finalizeWorkflow(): Promise<any>;
    popWorkflow(): Promise<any>;
    setWorkflowValue(key: string, value: string): Promise<any>;
    setWorkflowKGValue(key: string, uid: string, value: string): Promise<any>;
}
