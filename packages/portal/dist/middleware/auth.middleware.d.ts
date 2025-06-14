import { NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ShutterWebSocketClientService } from '../services/shutter-websocket-client.service';
export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        jwt: string;
    };
}
export declare class AuthMiddleware implements NestMiddleware {
    private readonly shutterClient;
    constructor(shutterClient: ShutterWebSocketClientService);
    use(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>;
}
