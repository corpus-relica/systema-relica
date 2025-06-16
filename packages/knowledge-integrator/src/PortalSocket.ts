import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./authProvider";

export interface SetupProgressUpdate {
  state: {
    id: string;
    substate?: string;
    full_path: string[];
  };
  progress: number;
  status: string;
  error?: string;
  masterUser?: string;
}

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

    this.setupEventListeners();
    this.isConnecting = false;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to Portal WebSocket');
      this.reconnectAttempts = 0;
      
      // Register client for setup updates
      this.socket?.emit('register-client', {
        clientType: 'SETUP_WIZARD',
        timestamp: Date.now()
      });
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Portal WebSocket:', reason);
      this.handleReconnect();
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Portal WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('setup-progress', (data: SetupProgressUpdate) => {
      console.log('📊 Setup progress update:', data);
      // Emit custom event for setup wizard to listen to
      window.dispatchEvent(new CustomEvent('setup-progress', { detail: data }));
    });

    this.socket.on('setup-complete', (data) => {
      console.log('🎉 Setup complete:', data);
      window.dispatchEvent(new CustomEvent('setup-complete', { detail: data }));
    });

    this.socket.on('setup-error', (data) => {
      console.error('⚠️ Setup error:', data);
      window.dispatchEvent(new CustomEvent('setup-error', { detail: data }));
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

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public emit(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
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

  // Setup-specific methods
  public subscribeToSetupUpdates() {
    this.emit('subscribe-setup-updates', { timestamp: Date.now() });
  }

  public unsubscribeFromSetupUpdates() {
    this.emit('unsubscribe-setup-updates', { timestamp: Date.now() });
  }
}

// Export singleton instance
export const portalSocket = new PortalWebSocketClient();

// Setup progress event listener helpers
export const addSetupProgressListener = (callback: (data: SetupProgressUpdate) => void) => {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('setup-progress', handler as EventListener);
  return () => window.removeEventListener('setup-progress', handler as EventListener);
};

export const addSetupCompleteListener = (callback: (data: any) => void) => {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('setup-complete', handler as EventListener);
  return () => window.removeEventListener('setup-complete', handler as EventListener);
};

export const addSetupErrorListener = (callback: (data: any) => void) => {
  const handler = (event: CustomEvent) => callback(event.detail);
  window.addEventListener('setup-error', handler as EventListener);
  return () => window.removeEventListener('setup-error', handler as EventListener);
};