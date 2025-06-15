import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
export declare class PrismWebSocketClientService extends BaseWebSocketClient {
    constructor(configService: ConfigService);
    getSetupStatus(): Promise<any>;
    startSetup(): Promise<any>;
    createUser(userData: {
        username: string;
        password: string;
        confirmPassword: string;
    }): Promise<any>;
    importData(importData: {
        dataSource: string;
        options?: any;
    }): Promise<any>;
}
