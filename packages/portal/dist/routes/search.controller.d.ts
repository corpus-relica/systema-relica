import { ArchivistWebSocketClientService } from '../services/archivist-websocket-client.service';
export declare class SearchController {
    private readonly archivistClient;
    constructor(archivistClient: ArchivistWebSocketClientService);
    searchText(user: any, query: string, limit?: string, offset?: string): Promise<{
        success: boolean;
        results: any;
        total: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        results?: undefined;
        total?: undefined;
    }>;
    searchByUid(user: any, uid: string): Promise<{
        success: boolean;
        entity: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        entity?: undefined;
    }>;
}
