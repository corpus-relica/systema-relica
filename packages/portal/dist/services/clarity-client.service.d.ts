import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class ClarityClientService {
    private readonly httpService;
    private readonly configService;
    private readonly baseUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    getModel(): Promise<any>;
    getKindModel(uid: string): Promise<any>;
    getIndividualModel(uid: string): Promise<any>;
    getEnvironment(environmentId: string): Promise<any>;
    createModel(modelData: any): Promise<any>;
    private handleError;
}
