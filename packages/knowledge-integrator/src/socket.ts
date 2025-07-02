import { io, Socket } from "socket.io-client";
import { getAuthToken } from "./authProvider";

class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, callback: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, data: any) {
    console.log(`Emitting event: ${event}`, data);
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(data));
  }
}

// Legacy CC Socket implementation (commented out - not currently used)
// class CCSocket extends EventEmitter {
//   private ws: WebSocket | null = null;
//   private url: string;
//
//   constructor() {
//     super();
//     this.url =
//       import.meta.env.VITE_RELICA_CC_SOCKET_URL || "http://localhost:3001";
//   }
//
//   private connect() {
//     // ... legacy implementation
//   }
// }

// Legacy NOUS socket function (keeping for compatibility)
export const sockSendNous = (role: string, content: string) => {
  console.warn("sockSendNous is deprecated - use portalWs.send instead");
};

class PortalWebSocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private reconnectTimeout: number = 1000;
  private maxReconnectTimeout: number = 30000;
  private jwtToken: string | null = null;
  private socketToken: string | null = null;
  private isConnecting: boolean = false;
  private isAuthenticated: boolean = false;
  private pingInterval: number | null = null;
  public clientId: string | null = null;

  constructor() {
    super();
    console.log("PortalWebSocketClient created");
  }

  getClientId(): string | null {
    return this.clientId;
  }

  private handleMessage(message: any) {
    try {
      console.log("Received message:", message);

      let payload = message.payload || message.data;

      // Handle standardized response format
      if ('success' in message) {
        if (message.success) {
          payload = message.data;
        } else {
          payload = {
            error: typeof message.error === 'object' ? message.error : { message: message.error }
          };
          console.error("Socket.IO error response:", message.error);
        }
      }

      console.log("MESSGE PAYLOAD:", message, message.payload)
      // Emit to our internal event system
      this.emit(message.type || message.event, payload);

      // Handle authentication response
      if (message.type === "auth" || message.event === "auth") {
        this.handleAuthResponse(message);
      }

      // Handle client registration
      if (message.type === "system:clientRegistered") {
        console.log("Client registered with ID:", payload.clientID);
        this.clientId = payload.clientID;
      }

    } catch (error) {
      console.error("Error handling Socket.IO message:", error);
    }
  }

  private handleAuthResponse(message: any) {
    if (message.success && message.data?.token) {
      this.socketToken = message.data.token;
      this.isAuthenticated = true;
      console.log("✅ Authentication successful, socket token received");
      this.emit("authenticated", message.data);
    } else {
      console.error("❌ Authentication failed:", message.error);
      this.isAuthenticated = false;
      this.emit("authenticationFailed", message.error);
    }
  }

  send(type: string, payload: any) {
    if (!this.socket?.connected) {
      console.warn("Socket.IO not connected, cannot send message");
      return;
    }

    if (!this.isAuthenticated && type !== "auth") {
      console.warn("Not authenticated, cannot send message:", type);
      return;
    }

    const id = Math.random().toString(36).substr(2, 9);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userID = user.id;

    const message = {
      id,
      type,
      payload: { ...payload, userId: userID, clientId: this.clientId },
    };

    console.log("Sending Socket.IO message:", message);
    this.socket.emit(type, message);
  }

  async connect(jwtToken?: string) {
    if (this.isConnecting) return;
    this.isConnecting = true;

    // Use provided token or get from auth provider
    this.jwtToken = jwtToken || getAuthToken();

    if (!this.jwtToken) {
      console.error("No JWT token available for Socket.IO connection");
      this.isConnecting = false;
      return;
    }

    console.log("🔌 Connecting to Portal via Socket.IO...");

    try {
      const portalUrl = import.meta.env.VITE_PORTAL_API_URL || "http://localhost:2204";
      
      this.socket = io(portalUrl, {
        transports: ["websocket"],
        timeout: 10000,
        autoConnect: false,
      });

      this.socket.on("connect", async () => {
        console.log("✅ Socket.IO connected to Portal");
        this.isConnecting = false;
        this.reconnectTimeout = 1000; // Reset backoff
        this.setupPing();
        const foo = await this.authenticateSocket();
        console.log("Authenticating Socket.IO connection with JWT:", foo);
        this.emit("connect", {});
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Socket.IO disconnected:", reason);
        this.isAuthenticated = false;
        this.cleanupPing();
        this.scheduleReconnect();
        this.emit("disconnect", { reason });
      });

      this.socket.on("connect_error", (error) => {
        console.error("🚫 Socket.IO connection error:", error);
        this.isConnecting = false;
        this.scheduleReconnect();
      });

      // Handle all message types
      this.socket.onAny((event, ...args) => {
        const message = args[0];
        this.handleMessage({ event, ...message });
      });

      // Connect the socket
      this.socket.connect();

    } catch (error) {
      console.error("Portal Socket.IO connection error:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private async authenticateSocket() {
    if (!this.jwtToken || !this.socket?.connected) {
      console.error("Cannot authenticate: missing token or socket not connected");
      return;
    }

    console.log("🔐 Authenticating Socket.IO connection...");

    const authMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type: "auth",
      payload: { jwt: this.jwtToken },
    };

    this.socket.emit("auth", authMessage, (response: any) => {
      if (response.success) {
        this.socketToken = response.data.token;
        this.clientId = response.data.clientID;
        this.isAuthenticated = true;
        console.log("✅ Socket.IO authentication successful !!!!", response);
        this.emit("system:clientRegistered", response.data);
      }
    });
  }

  private setupPing() {
    this.cleanupPing();

    // Send ping every 25 seconds
    this.pingInterval = window.setInterval(() => {
      if (this.socket?.connected && this.isAuthenticated) {
        console.log("Sending ping");
        this.send("ping", {});
      }
    }, 25000);

    // Handle server pings
    this.on("ping", () => {
      if (this.socket?.connected) {
        this.send("pong", {});
      }
    });
  }

  private cleanupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.jwtToken) {
      setTimeout(() => {
        this.connect(this.jwtToken!);
      }, this.reconnectTimeout);

      this.reconnectTimeout = Math.min(
        this.reconnectTimeout * 1.5,
        this.maxReconnectTimeout
      );
    }
  }

  close() {
    this.cleanupPing();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.isAuthenticated = false;
    this.jwtToken = null;
    this.socketToken = null;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getAuthenticationStatus(): boolean {
    return this.isAuthenticated;
  }
}

export const portalWs = new PortalWebSocketClient();

export const initializeWebSocket = async (token?: string) => {
  try {
    const res = await portalWs.connect(token);
    console.log('WebSocket initialized', res);
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
  }
};

export const closeWebSocket = () => {
  portalWs.close();
};

export const sendSocketMessage = (type: string, payload: any) => {
  if (!portalWs.isConnected()) {
    console.warn('Socket not connected');
    return;
  }
  if (!portalWs.getAuthenticationStatus()) {
    console.warn('Not authenticated, cannot send message');
    return;
  }
  portalWs.send(type, payload);
};

// Export for compatibility
export { portalWs as portalSocket };
