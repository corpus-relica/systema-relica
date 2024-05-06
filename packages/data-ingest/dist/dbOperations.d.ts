import { Fact } from './types.js';
export declare const clearDB: (batchSize?: number, nodeThreshold?: number, relThreshold?: number) => Promise<void>;
export declare const addFact: (fact: Fact) => Promise<void>;
export declare const remFact: (fact_uid: number) => Promise<void>;
export declare const remOrphanNodes: () => Promise<void>;
export declare const getFactsAboveThreshold: (threshold: number) => Promise<Fact[]>;
