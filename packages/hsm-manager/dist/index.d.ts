declare class HSMManager {
    private stack;
    private currentActor;
    private logger;
    constructor();
    startMachine(machineName: string): any;
    resumeLastMachine(): any;
    handleStateChange(snapshot: any): any;
    sendEvent(event: any): any;
    getPendingStates(): any[];
    getSnapshot(): any;
}
export default HSMManager;
