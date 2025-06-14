import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import { 
  ServiceMessage, 
  ServiceResponse, 
  ArchivistMessage, 
  ClarityMessage, 
  ApertureMessage, 
  PrismMessage 
} from '../types/websocket-messages';

export interface WebSocketServiceClient {
  connect(): Promise<void>;
  disconnect(): void;
  sendMessage<T = any>(message: ServiceMessage): Promise<ServiceResponse<T>>;
  isConnected(): boolean;
}

@Injectable()
export class BaseWebSocketClient implements WebSocketServiceClient, OnModuleInit, OnModuleDestroy {
  protected socket: Socket | null = null;
  protected readonly logger = new Logger(this.constructor.name);
  protected pendingRequests = new Map<string, {
    resolve: (value: ServiceResponse) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>();

  constructor(
    protected readonly configService: ConfigService,
    protected readonly serviceName: string,
    protected readonly defaultPort: number,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.disconnect();
  }

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const host = this.configService.get<string>(`${this.serviceName.toUpperCase()}_HOST`, 'localhost');
    const port = this.configService.get<number>(`${this.serviceName.toUpperCase()}_PORT`, this.defaultPort);
    const url = `ws://${host}:${port}`;

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Failed to connect to ${this.serviceName} service`));
      }, 5000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        this.logger.log(`Connected to ${this.serviceName} service at ${url}`);
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.logger.error(`Failed to connect to ${this.serviceName} service:`, error);
        reject(error);
      });

      this.socket!.connect();
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.logger.log(`Disconnected from ${this.serviceName} service`);
    }

    // Reject all pending requests
    for (const [id, request] of this.pendingRequests) {
      clearTimeout(request.timeout);
      request.reject(new Error(`Connection closed while waiting for response`));
    }
    this.pendingRequests.clear();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  async sendMessage<T = any>(message: ServiceMessage): Promise<ServiceResponse<T>> {
    if (!this.socket?.connected) {
      throw new Error(`Not connected to ${this.serviceName} service`);
    }

    const messageId = message.id || this.generateMessageId();
    const messageWithId = { ...message, id: messageId };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(messageId);
        reject(new Error(`Request timeout for ${this.serviceName} service`));
      }, 30000); // 30 second timeout

      this.pendingRequests.set(messageId, { resolve, reject, timeout });
      this.socket!.emit('message', messageWithId);
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('message', (response: ServiceResponse) => {
      const pendingRequest = this.pendingRequests.get(response.id);
      if (pendingRequest) {
        clearTimeout(pendingRequest.timeout);
        this.pendingRequests.delete(response.id);
        pendingRequest.resolve(response);
      }
    });

    this.socket.on('disconnect', () => {
      this.logger.warn(`Disconnected from ${this.serviceName} service`);
    });

    this.socket.on('reconnect', () => {
      this.logger.log(`Reconnected to ${this.serviceName} service`);
    });

    this.socket.on('error', (error) => {
      this.logger.error(`${this.serviceName} service error:`, error);
    });
  }

  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}