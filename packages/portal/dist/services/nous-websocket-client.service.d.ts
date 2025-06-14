import { ConfigService } from '@nestjs/config';
import { BaseWebSocketClient } from './websocket-client.service';
export declare class NousWebSocketClientService extends BaseWebSocketClient {
    constructor(configService: ConfigService);
    processChatInput(message: string, userId: string, context?: any): Promise<any>;
    generateResponse(prompt: string, context?: any): Promise<any>;
    private generateMessageId;
}
