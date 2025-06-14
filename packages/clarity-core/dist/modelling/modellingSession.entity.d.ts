export declare class ModellingSession {
    uid: number;
    state: Record<string, any>;
    getState(): Record<string, any>;
    setState(value: Record<string, any> | string): void;
}
