import { MockWebSocket } from "../mocks/websocket";

/**
 * Generic WebSocket testing helpers
 * Extracted and generalized from viewfinder's cacheTestHelpers
 */

export interface WebSocketTestOptions {
  url?: string;
  protocols?: string | string[];
  autoOpen?: boolean;
}

export const setupMockWebSocket = (
  options: WebSocketTestOptions = {}
): MockWebSocket => {
  const { url = "ws://mock-server", protocols, autoOpen = true } = options;

  const mockWs = new MockWebSocket(url, protocols);
  if (autoOpen) {
    mockWs.readyState = WebSocket.OPEN;
  }
  return mockWs;
};

export const cleanupMockWebSocket = (): void => {
  MockWebSocket.resetInstance();
};

export const waitForWebSocketMessage = (
  mockWs: MockWebSocket,
  messageType: string,
  timeout: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      mockWs.off("send", handler);
      reject(
        new Error(
          `Timeout waiting for WebSocket message of type: ${messageType}`
        )
      );
    }, timeout);

    const handler = (data: any) => {
      if (data.type === messageType) {
        clearTimeout(timeoutId);
        mockWs.off("send", handler);
        resolve(data);
      }
    };

    mockWs.on("send", handler);
  });
};

export const waitForWebSocketEvent = (
  mockWs: MockWebSocket,
  eventType: string,
  timeout: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      mockWs.off(eventType, handler);
      reject(new Error(`Timeout waiting for WebSocket event: ${eventType}`));
    }, timeout);

    const handler = (data: any) => {
      clearTimeout(timeoutId);
      mockWs.off(eventType, handler);
      resolve(data);
    };

    mockWs.once(eventType, handler);
  });
};

export const expectWebSocketMessage = (
  mockWs: MockWebSocket,
  expectedMessage: any,
  timeout: number = 5000
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      mockWs.off("send", handler);
      reject(new Error("WebSocket message timeout"));
    }, timeout);

    const handler = (data: any) => {
      clearTimeout(timeoutId);
      mockWs.off("send", handler);
      try {
        expect(data).toMatchObject(expectedMessage);
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    mockWs.once("send", handler);
  });
};

export const simulateWebSocketFlow = async (
  mockWs: MockWebSocket,
  messages: any[],
  delayBetweenMessages: number = 100
): Promise<void> => {
  for (const message of messages) {
    await new Promise((resolve) => setTimeout(resolve, delayBetweenMessages));
    mockWs.mockServerMessage(message);
  }
};

export const createMockWebSocketServer = () => {
  const connections: MockWebSocket[] = [];

  return {
    addConnection: (ws: MockWebSocket) => {
      connections.push(ws);
    },

    removeConnection: (ws: MockWebSocket) => {
      const index = connections.indexOf(ws);
      if (index > -1) {
        connections.splice(index, 1);
      }
    },

    broadcast: (message: any) => {
      connections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.mockServerMessage(message);
        }
      });
    },

    getConnections: () => [...connections],

    closeAll: () => {
      connections.forEach((ws) => ws.close());
      connections.length = 0;
    },
  };
};

export interface MockAuthContext {
  user?: {
    id: string;
    username: string;
    isAdmin?: boolean;
    roles?: string[];
  };
  token?: string;
  isAuthenticated?: boolean;
}

export const createMockAuthContext = (
  options: MockAuthContext = {}
): MockAuthContext => ({
  user: {
    id: "test-user",
    username: "testuser",
    isAdmin: true,
    roles: ["user"],
    ...options.user,
  },
  token: "mock-token",
  isAuthenticated: true,
  ...options,
});

export const createMockProgressFlow = (
  totalSteps: number = 5,
  stepDelay: number = 100
) => {
  const messages: any[] = [];

  // Initial response
  messages.push({
    type: "operation-response",
    status: "accepted",
    requestId: "test-request-1",
  });

  // Progress updates
  for (let i = 1; i <= totalSteps; i++) {
    const progress = Math.floor((i / totalSteps) * 100);
    messages.push({
      type: "operation-progress",
      requestId: "test-request-1",
      progress,
      stage: `Step ${i}`,
      detail: `Processing step ${i} of ${totalSteps}`,
    });
  }

  // Completion
  messages.push({
    type: "operation-complete",
    requestId: "test-request-1",
    status: "success",
  });

  return {
    messages,
    simulate: async (mockWs: MockWebSocket) => {
      await simulateWebSocketFlow(mockWs, messages, stepDelay);
    },
  };
};
