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
  private jwtToken: string | null = null;
  private socketToken: string | null = null;
  private isConnecting: boolean = false;
  private pingInterval: number | null = null;
  private clientId: string | null = null;

  constructor() {
    super();
    console.log("PortalWebSocketClient created");
  }

  getClientId(): string | null {
    return this.clientId;
  }

  onmessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data);
      console.log("Parsed message:", message);
      
      let payload = message.payload;
      
      // Handle standardized response format
      // New format: {"success": true, "request_id": "...", "data": {...}}
      // or {"success": false, "request_id": "...", "error": {...}}
      if ('success' in message) {
        if (message.success) {
          // Success response
          payload = message.data;
        } else {
          // Error response
          payload = { 
            error: typeof message.error === 'object' ? message.error : { message: message.error }
          };
          console.error("WebSocket error response:", message.error);
        }
      }
      
      // Emit to our internal event system using the standardized payload
      this.emit(message.type, payload);
      
      // Handle client registration
      if (message.type === "system:clientRegistered") {
        console.log("Client registered with ID:", payload.clientID);
        this.clientId = payload.clientID;
      }
      
      // Dispatch message as a DOM event for components to listen to
      const eventName = message.type.replace(/:/g, '-');
      const customEvent = new CustomEvent(`portal:${eventName}`, { 
        detail: payload 
      });
      document.dispatchEvent(customEvent);
      
      // For handling response messages from our request-response pattern
      if (message.type === 'response') {
        const responseEvent = new CustomEvent('ws:response', { 
          detail: message 
        });
        document.dispatchEvent(responseEvent);
      }
    } catch (error) {
      console.error("Error parsing WebSocket message:", error);
    }
  }

  send(type: string, payload: any) {
    const id = Math.random().toString(36).substr(2, 9);
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userID = user.id;
    const clientID = this.clientId;

    if (this.ws?.readyState === WebSocket.OPEN && userID) {
      const finalPayload = { ...payload, "user-id": userID, "client-id": clientID};
      this.ws.send(
        JSON.stringify({
          id,
          type,
          payload: finalPayload,
        })
      );
    } else {
      console.warn("WebSocket not ready or user not authenticated");
    }
  }

  async connect(jwtToken: string) {
    if (this.isConnecting) return;
    this.isConnecting = true;
    this.jwtToken = jwtToken;

    console.log(
      "Connect PortalWebsocketClient !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1"
    );

    try {
      // First get our socket token
      console.log("Requesting socket token...");
      const wsAuthResponse = await fetch(
        `${import.meta.env.VITE_PORTAL_WS_URL || "http://localhost:2174"}/ws-auth`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${jwtToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!wsAuthResponse.ok) {
        throw new Error(`Failed to get socket token: ${wsAuthResponse.status}`);
      }

      const wsAuthData = await wsAuthResponse.json();
      this.socketToken = wsAuthData.token;
      console.log("Received socket token:", this.socketToken);

      if (!this.socketToken) {
        throw new Error("No socket token received");
      }

      const wsUrl = `${
        import.meta.env.VITE_PORTAL_WS_URL || "ws://localhost:2174"
      }/chsk?token=${encodeURIComponent(this.socketToken)}`;

      console.log("Attempting WebSocket connection to:", wsUrl);
      console.log("Current protocol:", window.location.protocol);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connection opened!");
        this.isConnecting = false;
        this.reconnectTimeout = 1000; // Reset backoff
        this.setupPing(); // Set up ping handling

        this.emit("connect");
      };

      this.ws.onmessage = this.onmessage.bind(this);

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        console.log("WebSocket state:", this.ws?.readyState);
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        this.cleanupPing();
        this.scheduleReconnect();

        this.emit("disconnect");
      };

    } catch (error) {
      console.error("Portal WebSocket connection error:", error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupPing() {
    // Clear any existing ping handlers
    this.cleanupPing();

    // Send ping every 25 seconds
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log("Sending ping");
        // this.ws.send(JSON.stringify({ type: "ping" }));
        this.send("ping", {});
      }
    }, 25000);

    // Also handle server pings (though they shouldn't happen)
    this.on("ping", () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        // this.ws.send(JSON.stringify({ type: "pong" }));
        this.send("ping", {});
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

  close() {
    this.cleanupPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.jwtToken = null;
  }
}

export const portalWs = new PortalWebSocketClient();

export const initializeWebSocket = async (token: string) => {
  try {
    await portalWs.connect(token);
    console.log('WebSocket initialized');
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
  }
};

export const closeWebSocket = () => {
  portalWs.close();
};

export const sendSocketMessage = (type: string, payload: any) => {
  if (!portalWs.getClientId()) {
    console.warn('Attempting to send message before client registration');
    return;
  }
  portalWs.send(type, payload);
};
