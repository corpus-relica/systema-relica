import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ShutterWebSocketClientService } from '../services/shutter-websocket-client.service';
export declare class AuthGuard implements CanActivate {
    private readonly shutterClient;
    private readonly reflector;
    constructor(shutterClient: ShutterWebSocketClientService, reflector: Reflector);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
