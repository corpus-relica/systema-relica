import { EventEmitter } from 'events';

class MockWebSocket extends EventEmitter {
  private static instance: MockWebSocket | null = null;
  public readyState: number = WebSocket.OPEN;
  public url: string = '';
  
  static getInstance(): MockWebSocket {
    if (!MockWebSocket.instance) {
      MockWebSocket.instance = new MockWebSocket();
    }
    return MockWebSocket.instance;
  }

  static resetInstance(): void {
    MockWebSocket.instance = null;
  }

  constructor() {
    super();
    this.url = 'ws://mock-server';
  }

  send(data: string): void {
    // Emit the sent message for test verification
    this.emit('send', JSON.parse(data));
  }

  // Mock server response helper
  mockServerMessage(data: any): void {
    this.emit('message', { data: JSON.stringify(data) });
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    this.emit('close');
  }
}

// Mock implementation for the global WebSocket
global.WebSocket = MockWebSocket as any;

export { MockWebSocket };