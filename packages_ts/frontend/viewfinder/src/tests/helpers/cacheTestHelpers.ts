import { MockWebSocket } from '../setup/websocketMock';
import { mockCacheRebuildEvents } from '../setup/cacheMockData';

export const setupMockWebSocket = (): MockWebSocket => {
  const mockWs = MockWebSocket.getInstance();
  mockWs.readyState = WebSocket.OPEN;
  return mockWs;
};

export const cleanupMockWebSocket = (): void => {
  MockWebSocket.resetInstance();
};

export const simulateCacheRebuildFlow = async (mockWs: MockWebSocket, options: {
  cacheType?: string;
  shouldError?: boolean;
  progressUpdates?: number;
} = {}) => {
  const { cacheType = 'all', shouldError = false, progressUpdates = 3 } = options;
  
  // Simulate initial response
  mockWs.mockServerMessage({
    ...mockCacheRebuildEvents.initResponse,
    cacheType
  });
  
  // Simulate progress updates
  if (!shouldError) {
    for (let i = 1; i <= progressUpdates; i++) {
      const progress = Math.floor((i / progressUpdates) * 100);
      await new Promise(resolve => setTimeout(resolve, 100));
      mockWs.mockServerMessage({
        ...mockCacheRebuildEvents.progress,
        progress,
        detail: `Processed ${progress * 10}/${progressUpdates * 100} entities`
      });
    }
    
    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 100));
    mockWs.mockServerMessage(mockCacheRebuildEvents.completion);
  } else {
    // Simulate error
    await new Promise(resolve => setTimeout(resolve, 100));
    mockWs.mockServerMessage(mockCacheRebuildEvents.error);
  }
};

export const waitForWebSocketMessage = (mockWs: MockWebSocket, messageType: string): Promise<any> => {
  return new Promise((resolve) => {
    const handler = (data: any) => {
      if (data.type === messageType) {
        mockWs.off('send', handler);
        resolve(data);
      }
    };
    mockWs.on('send', handler);
  });
};

export const createMockAuthContext = (isAdmin: boolean = true) => ({
  user: {
    id: 'test-user',
    username: 'testuser',
    isAdmin
  },
  token: 'mock-token',
  isAuthenticated: true
});

export const expectWebSocketMessage = (mockWs: MockWebSocket, expectedMessage: any) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('WebSocket message timeout'));
    }, 5000);
    
    mockWs.once('send', (data) => {
      clearTimeout(timeout);
      try {
        expect(data).toMatchObject(expectedMessage);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
  });
};