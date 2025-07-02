import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';

export interface WebSocketServiceClient {
  connect(): Promise<void>;
  disconnect(): void;
  sendMessage(message: ServiceMessage): Promise<ServiceResponse>;
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

// Base class that all WebSocket services can extend
export abstract class BaseWebSocketClient implements OnModuleInit, OnModuleDestroy {
  protected socket: Socket | null = null;
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  protected messageCounter = 0;
  protected eventHandlers: Map<string, Function[]> = new Map();

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
      // Using JSON for optimal performance and compatibility
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

  protected setupEventHandlers(): void {
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

    // Allow subclasses to add service-specific event handlers
    this.setupServiceSpecificEventHandlers();
  }

  // Hook for subclasses to implement service-specific event handling
  protected setupServiceSpecificEventHandlers(): void {
    // Default implementation does nothing
  }

  protected generateMessageId(): string {
    return crypto.randomUUID();
  }

  // Direct JSON communication for optimal performance

  protected async sendRequestMessage(action: string, payload: any): Promise<any> {
    if (!this.socket?.connected) {
      this.logger.log(`Not connected to ${this.serviceName}, attempting to connect...`);
      try {
        await this.connect();
      } catch (error) {
        throw new Error(
          `Failed to connect to ${this.serviceName} service: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    // Create proper request message structure per WebSocket contracts
    const message = {
      id: this.generateMessageId(),
      type: 'request' as const,
      service: this.serviceName,
      action,
      payload,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Request timeout for ${this.serviceName} service`));
      }, 30000);

      this.socket!.emit(action, message, (response: any) => {
        clearTimeout(timeout);

        if (response && response.success === false) {
          reject(new Error(response.error || 'Request failed'));
        } else {
          resolve(response?.data || response);
        }
      });
    });
  }

  // Event handling methods for services that need them
  public on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  public off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  protected emitToHandlers(event: string, payload: any): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          this.logger.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Connection utilities
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }
}
