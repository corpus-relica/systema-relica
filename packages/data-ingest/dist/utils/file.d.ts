export declare const writeFileAsync: (filename: string, data: any, log?: (x: string) => void) => Promise<void>;
export declare const processFilesInDirectory: (directory: string, func: (filename: string) => Promise<void>) => Promise<void>;
