import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
export declare class ArchivistWebSocketClientService extends BaseWebSocketClient {
    constructor(configService: ConfigService);
    getKinds(): Promise<any>;
    searchText(query: string, limit?: number, offset?: number): Promise<any>;
    searchUid(uid: string): Promise<any>;
    resolveUids(uids: string[]): Promise<any>;
    getClassified(uid: string): Promise<any>;
    getSubtypes(uid: string): Promise<any>;
    getSubtypesCone(uid: string): Promise<any>;
    submitFact(factData: any): Promise<any>;
    deleteFact(factId: string): Promise<any>;
}
