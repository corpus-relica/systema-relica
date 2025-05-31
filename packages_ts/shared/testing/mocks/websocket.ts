import { EventEmitter } from "events";

/**
 * Generic WebSocket mock that can be used across all packages
 * Extracted and generalized from viewfinder's MockWebSocket
 */
export class MockWebSocket extends EventEmitter {
  private static instance: MockWebSocket | null = null;
  public readyState: number = WebSocket.OPEN;
  public url: string = "";
  public protocol: string = "";
  public extensions: string = "";
  public bufferedAmount: number = 0;
  public binaryType: BinaryType = "blob";

  static getInstance(): MockWebSocket {
    if (!MockWebSocket.instance) {
      MockWebSocket.instance = new MockWebSocket();
    }
    return MockWebSocket.instance;
  }

  static resetInstance(): void {
    if (MockWebSocket.instance) {
      MockWebSocket.instance.removeAllListeners();
      MockWebSocket.instance = null;
    }
  }

  constructor(url: string = "ws://mock-server", protocols?: string | string[]) {
    super();
    this.url = url;
    this.protocol = Array.isArray(protocols)
      ? protocols[0] || ""
      : protocols || "";
  }

  send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket is not open");
    }

    let parsedData: any;
    try {
      parsedData = typeof data === "string" ? JSON.parse(data) : data;
    } catch {
      parsedData = data;
    }

    // Emit the sent message for test verification
    this.emit("send", parsedData);
  }

  // Mock server response helper
  mockServerMessage(data: any): void {
    if (this.readyState === WebSocket.OPEN) {
      const messageEvent = {
        data: typeof data === "string" ? data : JSON.stringify(data),
        type: "message",
        target: this,
        currentTarget: this,
        bubbles: false,
        cancelable: false,
        defaultPrevented: false,
        eventPhase: 0,
        isTrusted: true,
        timeStamp: Date.now(),
      };
      this.emit("message", messageEvent);
    }
  }

  close(code?: number, reason?: string): void {
    this.readyState = WebSocket.CLOSED;
    const closeEvent = {
      code: code || 1000,
      reason: reason || "",
      wasClean: true,
      type: "close",
      target: this,
      currentTarget: this,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      timeStamp: Date.now(),
    };
    this.emit("close", closeEvent);
  }

  // Mock connection opening
  mockOpen(): void {
    this.readyState = WebSocket.OPEN;
    const openEvent = {
      type: "open",
      target: this,
      currentTarget: this,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      timeStamp: Date.now(),
    };
    this.emit("open", openEvent);
  }

  // Mock connection error
  mockError(error?: Error): void {
    const errorEvent = {
      error: error || new Error("Mock WebSocket error"),
      type: "error",
      target: this,
      currentTarget: this,
      bubbles: false,
      cancelable: false,
      defaultPrevented: false,
      eventPhase: 0,
      isTrusted: true,
      timeStamp: Date.now(),
    };
    this.emit("error", errorEvent);
  }

  // WebSocket interface compatibility
  addEventListener(type: string, listener: EventListener): void {
    this.on(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.off(type, listener);
  }

  dispatchEvent(event: Event): boolean {
    this.emit(event.type, event);
    return true;
  }

  // Properties for compatibility
  get onopen() {
    return null;
  }
  set onopen(handler: ((this: WebSocket, ev: Event) => any) | null) {
    if (handler) this.on("open", handler);
  }

  get onclose() {
    return null;
  }
  set onclose(handler: ((this: WebSocket, ev: CloseEvent) => any) | null) {
    if (handler) this.on("close", handler);
  }

  get onmessage() {
    return null;
  }
  set onmessage(handler: ((this: WebSocket, ev: MessageEvent) => any) | null) {
    if (handler) this.on("message", handler);
  }

  get onerror() {
    return null;
  }
  set onerror(handler: ((this: WebSocket, ev: Event) => any) | null) {
    if (handler) this.on("error", handler);
  }
}

// Global WebSocket mock setup function
export const setupGlobalWebSocketMock = (): void => {
  (global as any).WebSocket = MockWebSocket as any;

  // Mock WebSocket constants
  (global as any).WebSocket.CONNECTING = 0;
  (global as any).WebSocket.OPEN = 1;
  (global as any).WebSocket.CLOSING = 2;
  (global as any).WebSocket.CLOSED = 3;
};

// Cleanup function
export const cleanupGlobalWebSocketMock = (): void => {
  MockWebSocket.resetInstance();
  delete (global as any).WebSocket;
};
