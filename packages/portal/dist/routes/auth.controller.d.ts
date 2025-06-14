import { ShutterWebSocketClientService } from '../services/shutter-websocket-client.service';
export declare class AuthController {
    private readonly shutterClient;
    constructor(shutterClient: ShutterWebSocketClientService);
    authenticateWebSocket(user: any): Promise<{
        success: boolean;
        token: string;
        'user-id': any;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        token?: undefined;
        'user-id'?: undefined;
    }>;
}
