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

  constructor() {
    super();
    console.log("PortalWebSocketClient created");
  }

  private async getSocketToken(): Promise<string> {
    const response = await fetch(
      `${import.meta.env.VITE_PORTAL_URL || "http://localhost:2174"}/ws-auth`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.jwtToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get socket token");
    }

    const data = await response.json();
    return data.token;
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
        `${import.meta.env.VITE_PORTAL_URL || "http://localhost:2174"}/ws-auth`,
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
        // // Let's send an immediate test message
        // const testMsg = {
        //   type: "test",
        //   data: "Testing connection",
        // };
        // console.log("Sending test message:", testMsg);
        // this.ws?.send(JSON.stringify(testMsg));

        console.log("WebSocket connection opened!");
        this.isConnecting = false;
        this.reconnectTimeout = 1000; // Reset backoff
        this.setupPing(); // Set up ping handling
      };

      this.ws.onmessage = (event) => {
        console.log("WebSocket message received:", event.data);
        // try {
        //   const parsed = JSON.parse(event.data);
        //   console.log("Parsed message:", parsed);
        // } catch (e) {
        //   console.error("Error parsing message:", e);
        // }
        try {
          const message = JSON.parse(event.data);
          console.log("Parsed message:", message);
          this.emit(message.type, message.payload);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          console.error("Portal WebSocket connection error:", error);
          this.cleanupPing();
          this.isConnecting = false;
          this.scheduleReconnect();
        }
      };

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
      };

      // Test sending a message:
      // this.ws.send(
      //   JSON.stringify({
      //     type: "test",
      //     data: "Hello from the client!",
      //   })
      // );

      //
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
        this.ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    // Also handle server pings (though they shouldn't happen)
    this.on("ping", () => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: "pong" }));
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

  send(type: string, payload: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  // close() {
  //   this.token = null;
  //   this.cleanupPing();
  //   if (this.ws) {
  //     this.ws.close();
  //     this.ws = null;
  //   }
  // }

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
  console.log("Initializing WebSocket with token:", token);
  await portalWs.connect(token);
};

export const closeWebSocket = () => {
  portalWs.close();
};

export const sendSocketMessage = (type: string, payload: any) => {
  portalWs.send(type, payload);
};
