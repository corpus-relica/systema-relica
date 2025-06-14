import { PrismWebSocketClientService } from '../services/prism-websocket-client.service';
export declare class PrismController {
    private readonly prismClient;
    constructor(prismClient: PrismWebSocketClientService);
    getSetupStatus(user: any): Promise<{
        success: boolean;
        status: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        status?: undefined;
    }>;
    startSetup(user: any): Promise<{
        success: boolean;
        result: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        result?: undefined;
    }>;
    createUser(user: any, body: {
        username: string;
        password: string;
        confirmPassword: string;
    }): Promise<{
        success: boolean;
        result: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        result?: undefined;
    }>;
    importData(user: any, body: {
        dataSource: string;
        options?: any;
    }): Promise<{
        success: boolean;
        result: any;
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        result?: undefined;
    }>;
}
