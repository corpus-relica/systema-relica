import { ClarityWebSocketClientService } from '../services/clarity-websocket-client.service';
export declare class EnvironmentController {
    private readonly clarityClient;
    constructor(clarityClient: ClarityWebSocketClientService);
    retrieveEnvironment(user: any, uid: string): Promise<{
        success: boolean;
        environment: any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        environment?: undefined;
    }>;
}
