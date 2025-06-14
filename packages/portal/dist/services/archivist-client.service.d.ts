import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class ArchivistClientService {
    private readonly httpService;
    private readonly configService;
    private readonly baseUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    getKinds(params?: any): Promise<any>;
    searchText(query: string, limit?: number, offset?: number): Promise<any>;
    searchByUid(uid: string): Promise<any>;
    resolveUids(uids: string[]): Promise<any>;
    getClassifiedFacts(uid: string): Promise<any>;
    getSubtypes(uid: string): Promise<any>;
    getSubtypesCone(uid: string): Promise<any>;
    private handleError;
}
