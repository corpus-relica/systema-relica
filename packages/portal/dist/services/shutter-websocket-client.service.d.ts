import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
export declare class ShutterWebSocketClientService extends BaseWebSocketClient {
    constructor(configService: ConfigService);
    validateJWT(jwt: string): Promise<any>;
    authenticate(credentials: {
        username: string;
        password: string;
    }): Promise<any>;
    refreshToken(refreshToken: string): Promise<any>;
}
