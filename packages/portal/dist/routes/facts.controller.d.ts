import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';
export declare class FactsController {
    private readonly archivistClient;
    constructor(archivistClient: ArchivistWebSocketClientService);
    getClassifiedFacts(user: any, uid: string): Promise<{
        success: boolean;
        facts: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        facts?: undefined;
    }>;
    getSubtypes(user: any, uid: string): Promise<{
        success: boolean;
        subtypes: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        subtypes?: undefined;
    }>;
    getSubtypesCone(user: any, uid: string): Promise<{
        success: boolean;
        cone: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        cone?: undefined;
    }>;
}
