import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import customParser from 'socket.io-msgpack-parser';

export interface WebSocketServiceClient {
  connect(): Promise<void>;
  disconnect(): void;
  sendMessage(message: any): Promise<any>;
  isConnected(): boolean;
  onBroadcast(callback: (message: any) => void): void;
  offBroadcast(callback: (message: any) => void): void;
}

export interface ServiceMessage {
  id?: string;
  type: 'request';
  service: string;
  action: string;
  payload?: any;
}

export interface ServiceResponse {
  id: string;
  type: 'response';
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class PortalSocketClient implements WebSocketServiceClient, OnModuleInit, OnModuleDestroy {
  public socket: Socket | null = null;
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly configService: ConfigService,
    protected readonly serviceName: string,
    protected readonly defaultPort: number,
  ) {}

  async onModuleInit() {
    this.connect().catch(err => {
      this.logger.warn(`Could not connect to ${this.serviceName} on startup: ${err.message}`);
      this.logger.warn(`Will retry when first request is made`);
    });
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
      parser: customParser,
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
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  async sendMessage(message: ServiceMessage): Promise<ServiceResponse> {
    if (!this.socket?.connected) {
      this.logger.log(`Not connected to ${this.serviceName}, attempting to connect...`);
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect to ${this.serviceName} service: ${(error as Error).message}`);
      }
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for ${this.serviceName} service`));
      }, 30000);

      this.socket!.emit(message.action, message.payload || {}, (response: any) => {
        clearTimeout(timeout);
        
        const serviceResponse: ServiceResponse = {
          id: message.id || this.generateMessageId(),
          type: 'response',
          success: response.success !== undefined ? response.success : true,
          data: response.data || response,
          error: response.error
        };
        
        resolve(serviceResponse);
      });
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

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

  protected generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  onBroadcast(callback: (message: any) => void): void {
    // Implementation will be added by subclasses as needed
  }

  offBroadcast(callback: (message: any) => void): void {
    // Implementation will be added by subclasses as needed
  }
}

// Base class that services can extend - identical to PortalSocketClient
export class BaseWebSocketClient extends PortalSocketClient {
  constructor(
    configService: ConfigService,
    serviceName: string,
    defaultPort: number,
  ) {
    super(configService, serviceName, defaultPort);
  }
}