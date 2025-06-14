import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';
export declare class EntitiesController {
    private readonly archivistClient;
    constructor(archivistClient: ArchivistWebSocketClientService);
    getKinds(user: any): Promise<{
        success: boolean;
        kinds: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        kinds?: undefined;
    }>;
    resolveEntitiesGet(user: any, uids: string): Promise<{
        success: boolean;
        entities: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        entities?: undefined;
    }>;
    resolveEntitiesPost(user: any, body: {
        uids: string[];
    }): Promise<{
        success: boolean;
        entities: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        entities?: undefined;
    }>;
}
