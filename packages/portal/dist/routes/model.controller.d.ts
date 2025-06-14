import { ClarityWebSocketClientService } from '../services/clarity-websocket-client.service';
export declare class ModelController {
    private readonly clarityClient;
    constructor(clarityClient: ClarityWebSocketClientService);
    getModel(user: any): Promise<{
        success: boolean;
        model: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        model?: undefined;
    }>;
    getKindModel(user: any, uid: string): Promise<{
        success: boolean;
        kind: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        kind?: undefined;
    }>;
    getIndividualModel(user: any, uid: string): Promise<{
        success: boolean;
        individual: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        individual?: undefined;
    }>;
}
