// Simple browser-compatible event emitter
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
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(data));
  }
}

// Legacy CC Socket implementation
class CCSocket extends EventEmitter {
  private ws: WebSocket | null = null;
  private url: string;

  constructor() {
    super();
    this.url =
      import.meta.env.VITE_RELICA_CC_SOCKET_URL || "http://localhost:3001";
    //this.connect();
  }

  private connect() {
    this.ws = new WebSocket(this.url.replace("http", "ws"));

    this.ws.onopen = () => {
      console.log("CC WebSocket connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.emit(message.type, message.payload);
      } catch (error) {
        console.error("Error parsing CC WebSocket message:", error);
      }
    };

    this.ws.onclose = () => {
      console.log("CC WebSocket closed, reconnecting...");
      setTimeout(() => this.connect(), 1000);
    };
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }
}

// Export legacy ccSocket instance
export const ccSocket = new CCSocket();
export const sockSendCC = ccSocket.send.bind(ccSocket);

// New Portal WebSocket implementation
interface SocketMessage {
  type: string;
  payload: any;
}

class PortalWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private reconnectTimeout: number = 1000;
  private maxReconnectTimeout: number = 30000;
  private token: string | null = null;
  private isConnecting: boolean = false;
  private pingInterval: number | null = null;

  async connect(token: string) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.token = token;

    try {
      const wsUrl = `${
        import.meta.env.VITE_PORTAL_WS_URL || "ws://localhost:2173"
      }/chsk`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Portal WebSocket connected");
        this.isConnecting = false;
        this.reconnectTimeout = 1000;
        this.setupPing();

        // Send authentication immediately after connection
        this.send("auth", { token });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: SocketMessage = JSON.parse(event.data);
          this.emit(message.type, message.payload);
        } catch (error) {
          console.error("Error parsing Portal WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        this.isConnecting = false;
        this.cleanupPing();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("Portal WebSocket error:", error);
        this.ws?.close();
      };
    } catch (error) {
      console.error("Portal WebSocket connection error:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupPing() {
    this.pingInterval = window.setInterval(() => {
      this.send("ping", {});
    }, 30000);
  }

  private cleanupPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.token) {
      setTimeout(() => {
        this.connect(this.token!);
      }, this.reconnectTimeout);

      this.reconnectTimeout = Math.min(
        this.reconnectTimeout * 1.5,
        this.maxReconnectTimeout
      );
    }
  }

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  close() {
    this.token = null;
    this.cleanupPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const portalWs = new PortalWebSocketClient();

export const initializeWebSocket = async (token: string) => {
  await portalWs.connect(token);
};

export const closeWebSocket = () => {
  portalWs.close();
};

export const sendSocketMessage = (type: string, payload: any) => {
  portalWs.send(type, payload);
};
