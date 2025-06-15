import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
export declare class ClarityWebSocketClientService extends BaseWebSocketClient {
    constructor(configService: ConfigService);
    getModel(): Promise<any>;
    getKindModel(uid: string): Promise<any>;
    getIndividualModel(uid: string): Promise<any>;
    getEnvironment(environmentId: string): Promise<any>;
    createModel(modelData: any): Promise<any>;
    updateModel(modelId: string, modelData: any): Promise<any>;
}
