import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { io, Socket } from 'socket.io-client';
import customParser from 'socket.io-msgpack-parser';
import {
  ClarityActions,
} from '@relica/websocket-contracts';

@Injectable()
export class ClaritySocketClient implements OnModuleInit, OnModuleDestroy {
  private socket: Socket | null = null;
  private readonly logger = new Logger(ClaritySocketClient.name);
  private readonly pendingRequests = new Map<string, { resolve: Function; reject: Function }>();
  private messageCounter = 0;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    // Try to connect but don't fail startup if services aren't ready
    this.connect().catch(err => {
      this.logger.warn(`Could not connect to clarity on startup: ${err.message}`);
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

    const host = this.configService.get<string>('CLARITY_HOST', 'localhost');
    const port = this.configService.get<number>('CLARITY_PORT', 3003);
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
        reject(new Error('Failed to connect to clarity service'));
      }, 5000);

      this.socket!.on('connect', () => {
        clearTimeout(timeout);
        this.logger.log(`Connected to clarity service at ${url}`);
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeout);
        this.logger.error('Failed to connect to clarity service:', error);
        reject(error);
      });

      this.socket!.connect();
    });
  }

  private disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.logger.log('Disconnected from clarity service');
    }
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', () => {
      this.logger.warn('Disconnected from clarity service');
    });

    this.socket.on('reconnect', () => {
      this.logger.log('Reconnected to clarity service');
    });

    this.socket.on('error', (error) => {
      this.logger.error('Clarity service error:', error);
    });
  }

  private generateMessageId(): string {
    return crypto.randomUUID();
  }

  private async sendMessage(action: string, payload: any): Promise<any> {
    if (!this.socket?.connected) {
      this.logger.log('Not connected to clarity, attempting to connect...');
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect to clarity service: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Create proper request message structure per WebSocket contracts
    const message = {
      id: this.generateMessageId(),
      type: 'request' as const,
      service: 'clarity',
      action,
      payload,
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout for clarity service'));
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

  // =====================================================
  // MODEL OPERATIONS
  // =====================================================

  async getModel(uid: number): Promise<any> {
    const payload = uid ? { uid } : {};
    return this.sendMessage(ClarityActions.MODEL_GET, payload);
  }

  async getModelBatch(uids: string[]): Promise<any> {
    const payload = { uids };
    return this.sendMessage(ClarityActions.MODEL_GET_BATCH, payload);
  }

  async createModel(modelData: { name: string; type: string; data: any }): Promise<any> {
    return this.sendMessage(ClarityActions.MODEL_CREATE, modelData);
  }

  async updateModel(modelId: string, modelData: { name?: string; type?: string; data?: any }): Promise<any> {
    const payload = { modelId, ...modelData };
    return this.sendMessage(ClarityActions.MODEL_UPDATE, payload);
  }

  // =====================================================
  // KIND OPERATIONS
  // =====================================================

  async getKindModel(uid: string): Promise<any> {
    const payload = { uid };
    return this.sendMessage(ClarityActions.KIND_GET, payload);
  }

  // =====================================================
  // INDIVIDUAL OPERATIONS
  // =====================================================

  async getIndividualModel(uid: string): Promise<any> {
    const payload = { uid };
    return this.sendMessage(ClarityActions.INDIVIDUAL_GET, payload);
  }

  // =====================================================
  // ENVIRONMENT OPERATIONS
  // =====================================================

  async getEnvironment(environmentId: string): Promise<any> {
    const payload = { environmentId };
    return this.sendMessage(ClarityActions.ENVIRONMENT_GET, payload);
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
