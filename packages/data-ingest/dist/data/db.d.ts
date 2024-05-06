export declare const convertToInt: (neo4jInt: any) => any;
export declare const convertToDate: (neo4jDate: any) => string | undefined;
export declare const loadFromFileCreateNodes: (fileName: string, log?: (x: string) => void) => Promise<void>;
export declare const loadFromFileCreateRelationships: (fileName: string) => Promise<void>;
export declare const fetchPathsToRoot: (uid: number) => Promise<any[]>;
export declare const getLineage: (uid: number) => Promise<any>;
