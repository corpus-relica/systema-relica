import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import customParser from 'socket.io-msgpack-parser';
import {
  PrismActions,
  PrismEvents,
  SetupStatusBroadcastEvent,
} from '@relica/websocket-contracts';

@Injectable()
export class PrismSocketClient implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;
  private readonly logger = new Logger(PrismSocketClient.name);
  private readonly pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  private messageCounter = 0;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Try to connect but don't fail startup if services aren't ready
    this.connect().catch(err => {
      this.logger.warn(`Could not connect to prism on startup: ${err.message}`);
      this.logger.warn(`Will retry when first request is made`);
    });
  }

  async onModuleDestroy() {
    this.disconnect();
  }

  private async connect(): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    const host = this.configService.get<string>('PRISM_HOST', 'localhost');
    const port = this.configService.get<number>('PRISM_PORT', 3004);
    const url = `ws://${host}:${port}`;

    this.socket = io(url, {
      transports: ['websocket'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      // parser: customParser, // Use msgpack parser for better performance
    });

    this.setupEventHandlers();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Failed to connect to prism service'));
      }, 5000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        this.logger.log(`Connected to prism service at ${url}`);
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.logger.error('Failed to connect to prism service:', error);
        reject(error);
      });

      this.socket!.connect();
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.logger.log('Disconnected from prism service');
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      this.logger.warn('Disconnected from prism service');
    });

    this.socket.on('reconnect', () => {
      this.logger.log('Reconnected to prism service');
    });

    this.socket.on('error', (error) => {
      this.logger.error('Prism service error:', error);
    });

    // Forward Prism setup status broadcast events to registered handlers
    this.socket.on(PrismEvents.SETUP_STATUS_UPDATE, (broadcastEvent: SetupStatusBroadcastEvent) => {
      this.emitToHandlers(PrismEvents.SETUP_STATUS_UPDATE, broadcastEvent);
    });
  }

  private generateMessageId(): string {
    return crypto.randomUUID();
  }

  private async sendMessage(action: string, payload: any): Promise<any> {
    if (!this.socket?.connected) {
      this.logger.log('Not connected to prism, attempting to connect...');
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect to prism service: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Create proper request message structure per WebSocket contracts
    const message = {
      id: this.generateMessageId(),
      type: 'request' as const,
      service: 'prism',
      action,
      payload,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout for prism service'));
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

  // Event handling methods
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

  private emitToHandlers(event: string, payload: any): void {
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

  // =====================================================
  // SETUP OPERATIONS
  // =====================================================

  async getSetupStatus(): Promise<any> {
    const payload = {};
    return this.sendMessage(PrismActions.GET_SETUP_STATUS, payload);
  }

  async startSetup(): Promise<any> {
    const payload = {};
    return this.sendMessage(PrismActions.START_SETUP, payload);
  }

  async createUser(userData: { username: string; email?: string; password: string; confirmPassword?: string }): Promise<any> {
    return this.sendMessage(PrismActions.CREATE_USER, userData);
  }

  async importData(importData: { dataSource: string; options?: any }): Promise<any> {
    return this.sendMessage(PrismActions.IMPORT_DATA, importData);
  }

  async resetSystem(): Promise<any> {
    const payload = {};
    return this.sendMessage(PrismActions.RESET_SYSTEM, payload);
  }

  // =====================================================
  // CONNECTION UTILITIES
  // =====================================================

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  async ensureConnected(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }
}