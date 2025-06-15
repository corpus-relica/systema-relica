import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
export declare class ApertureWebSocketClientService extends BaseWebSocketClient {
    constructor(configService: ConfigService);
    getEnvironment(environmentId: string): Promise<any>;
    createEnvironment(environmentData: any): Promise<any>;
    updateEnvironment(environmentId: string, environmentData: any): Promise<any>;
    selectEntity(uid: string, userId: string, environmentId?: string): Promise<any>;
    loadEntities(environmentId: string, filters?: any): Promise<any>;
    loadSpecializationHierarchy(uid: string, userId: string): Promise<any>;
    clearEnvironmentEntities(userId: string, environmentId?: string): Promise<any>;
    loadAllRelatedFacts(uid: string, userId: string): Promise<any>;
}
