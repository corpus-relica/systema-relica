import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./authProvider";

// Import canonical types from WebSocket contracts
export type { SetupStatus, SetupStatusBroadcastEvent } from '@relica/websocket-contracts';

class PortalWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.isConnecting || this.socket?.connected) {
      return;
    }

    this.isConnecting = true;
    const portalUrl = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:2204';
    
    console.log('🔌 Connecting to Portal WebSocket:', portalUrl);

    this.socket = io(portalUrl, {
      auth: {
        token: getAuthToken()
      },
      query: {
        clientName: "KNOWLEDGE_INTEGRATOR"
      },
      transports: ['websocket', 'polling'],
      timeout: 10000,
      autoConnect: true
    });

    this.setupBaseEventListeners();
    this.isConnecting = false;
  }

  private setupBaseEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to Portal WebSocket');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Portal WebSocket:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Portal WebSocket connection error:', error);
      this.handleReconnect();
    });

    // Health check ping/pong
    this.socket.on('ping', () => {
      this.socket?.emit('pong');
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('🚫 Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  // Expose the socket instance for direct event handling
  public getSocket(): Socket | null {
    return this.socket;
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public emit(role:string, type: string, payload: any) {
    if (this.socket?.connected) {
      this.socket.emit(`${role}:${type}`, payload);
    } else {
      console.warn('⚠️ Socket not connected, cannot emit:', event);
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Direct Socket.IO event listener methods
  public on(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      console.log(`🔊 Listening for event: ${event}`);
      this.socket.on(event, callback);
    }
  }

  public off(event: string, callback?: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  public once(event: string, callback: (...args: any[]) => void) {
    if (this.socket) {
      this.socket.once(event, callback);
    }
  }
}

// Export singleton instance
export const portalSocket = new PortalWebSocketClient();
