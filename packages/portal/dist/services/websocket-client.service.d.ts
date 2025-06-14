/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io-client';
import { ServiceMessage, ServiceResponse } from '../types/websocket-messages';
export interface WebSocketServiceClient {
    connect(): Promise<void>;
    disconnect(): void;
    sendMessage<T = any>(message: ServiceMessage): Promise<ServiceResponse<T>>;
    isConnected(): boolean;
}
export declare class BaseWebSocketClient implements WebSocketServiceClient, OnModuleInit, OnModuleDestroy {
    protected readonly configService: ConfigService;
    protected readonly serviceName: string;
    protected readonly defaultPort: number;
    protected socket: Socket | null;
    protected readonly logger: Logger;
    protected pendingRequests: Map<string, {
        resolve: (value: ServiceResponse) => void;
        reject: (error: Error) => void;
        timeout: NodeJS.Timeout;
    }>;
    constructor(configService: ConfigService, serviceName: string, defaultPort: number);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    connect(): Promise<void>;
    disconnect(): void;
    isConnected(): boolean;
    sendMessage<T = any>(message: ServiceMessage): Promise<ServiceResponse<T>>;
    private setupEventHandlers;
    private generateMessageId;
}
