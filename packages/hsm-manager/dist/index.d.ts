declare class HSMManager {
    private stack;
    private currentActor;
    private logger;
    constructor();
    startMachine(machineName: string): void;
    resumeLastMachine(): void;
    handleStateChange(snapshot: any): void;
    sendEvent(event: any): void;
    getPendingStates(): any;
}
export default HSMManager;
