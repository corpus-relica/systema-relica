export const mockWebSocketGateway = {
  broadcastSetupUpdate: jest.fn(),
  server: {
    emit: jest.fn(),
    to: jest.fn(() => ({
      emit: jest.fn(),
    })),
  },
  handleConnection: jest.fn(),
  handleDisconnect: jest.fn(),
  afterInit: jest.fn(),
};

// Default return values for common scenarios
export const setupWebSocketMockDefaults = () => {
  mockWebSocketGateway.broadcastSetupUpdate.mockReturnValue(undefined);
  mockWebSocketGateway.server.emit.mockReturnValue(true);
};

// Test helpers
export const getLastBroadcastCall = () => {
  const calls = mockWebSocketGateway.broadcastSetupUpdate.mock.calls;
  return calls.length > 0 ? calls[calls.length - 1][0] : null;
};

export const getAllBroadcastCalls = () => {
  return mockWebSocketGateway.broadcastSetupUpdate.mock.calls.map(call => call[0]);
};

export const clearWebSocketMocks = () => {
  mockWebSocketGateway.broadcastSetupUpdate.mockClear();
  mockWebSocketGateway.server.emit.mockClear();
};