export declare enum WorkflowStatus {
    NOT_STARTED = "not-started",
    IN_PROGRESS = "in-progress",
    PENDING = "pending",
    COMPLETED = "completed"
}
declare class WorkflowManager {
    private _id;
    private _def;
    private _context;
    private currStepIdx;
    private currStepDef;
    private status;
    private _parent;
    private _children;
    constructor(def: any);
    get id(): string;
    get def(): any;
    get currentStep(): any;
    get isFinalStep(): boolean;
    get isRequiredStep(): any;
    get state(): {
        id: string;
        currentStep: any;
        isFinalStep: boolean;
        status: WorkflowStatus;
    };
    get steps(): any;
    get tree(): any[];
    get context(): any;
    get parent(): WorkflowManager;
    set parent(parent: WorkflowManager);
    get children(): Record<string, WorkflowManager>;
    fuckit(pattern: any): any[];
    get facts(): unknown[];
    areAllFieldsValid(): boolean;
    start(linkedField: any): any;
    next(): any;
    prev(): any;
    validate(): void;
    finalize(): void;
    setContext(key: string, value: {
        uid: number;
        value: string;
    }): void;
    getContext(key: string): any;
}
export default WorkflowManager;
