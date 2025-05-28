import { renderHook, act } from '@testing-library/react';
import { useCacheRebuild } from '../../hooks/useCacheRebuild';
import { MockWebSocket } from '../../../../../tests/setup/websocketMock';
import { mockCacheRebuildEvents } from '../../../../../tests/setup/cacheMockData';
import { setupMockWebSocket, cleanupMockWebSocket, simulateCacheRebuildFlow } from '../../../../../tests/helpers/cacheTestHelpers';

// Mock the socket module
jest.mock('../../../../../socket', () => ({
  getWebSocket: jest.fn()
}));

describe('useCacheRebuild', () => {
  let mockWs: MockWebSocket;
  let mockOnStateChange: jest.Mock;

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    mockOnStateChange = jest.fn();
    
    const { getWebSocket } = require('../../../../../socket');
    getWebSocket.mockReturnValue(mockWs);
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    expect(result.current.isConnected()).toBe(true);
    expect(typeof result.current.startCacheRebuild).toBe('function');
    expect(typeof result.current.cancelCacheRebuild).toBe('function');
  });

  it('returns false for isConnected when WebSocket is not available', () => {
    const { getWebSocket } = require('../../../../../socket');
    getWebSocket.mockReturnValue(null);

    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    expect(result.current.isConnected()).toBe(false);
  });

  it('sends cache rebuild request when startCacheRebuild is called', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    const sentMessages: any[] = [];
    mockWs.on('send', (data) => sentMessages.push(data));

    act(() => {
      result.current.startCacheRebuild(['all']);
    });

    expect(sentMessages).toHaveLength(1);
    expect(sentMessages[0]).toMatchObject({
      type: 'cache-rebuild-request',
      cacheTypes: ['all']
    });
    expect(sentMessages[0].requestId).toBeDefined();
  });

  it('handles cache rebuild response', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    act(() => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.initResponse);
    });

    expect(mockOnStateChange).toHaveBeenCalledWith({
      isRebuilding: true,
      progress: 0,
      currentPhase: 'Initializing',
      error: null,
      statusMessage: 'Cache rebuild started'
    });
  });

  it('handles progress updates', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    act(() => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.progress);
    });

    expect(mockOnStateChange).toHaveBeenCalledWith({
      progress: 45,
      currentPhase: 'Processing entities',
      statusMessage: 'Processed 450/1000 entities'
    });
  });

  it('handles completion event', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    act(() => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.completion);
    });

    expect(mockOnStateChange).toHaveBeenCalledWith({
      isRebuilding: false,
      progress: 100,
      currentPhase: 'Completed',
      statusMessage: 'Cache rebuild completed successfully',
      error: null
    });
  });

  it('handles error events', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    act(() => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.error);
    });

    expect(mockOnStateChange).toHaveBeenCalledWith({
      isRebuilding: false,
      error: 'Database connection failed',
      statusMessage: '',
      progress: 0
    });
  });

  it('handles unauthorized error', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    act(() => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.unauthorized);
    });

    expect(mockOnStateChange).toHaveBeenCalledWith({
      isRebuilding: false,
      error: 'Admin privileges required for cache rebuild',
      statusMessage: ''
    });
  });

  it('sends cancel request when cancelCacheRebuild is called', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    const sentMessages: any[] = [];
    mockWs.on('send', (data) => sentMessages.push(data));

    // Start rebuild first
    act(() => {
      result.current.startCacheRebuild(['all']);
    });

    const requestId = sentMessages[0].requestId;

    // Cancel rebuild
    act(() => {
      result.current.cancelCacheRebuild();
    });

    expect(sentMessages).toHaveLength(2);
    expect(sentMessages[1]).toMatchObject({
      type: 'cache-rebuild-cancel',
      requestId: requestId
    });
  });

  it('cleans up event listeners on unmount', () => {
    const removeListenerSpy = jest.spyOn(mockWs, 'removeListener');

    const { unmount } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    unmount();

    expect(removeListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('handles multiple cache types', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    const sentMessages: any[] = [];
    mockWs.on('send', (data) => sentMessages.push(data));

    act(() => {
      result.current.startCacheRebuild(['entity', 'relationship']);
    });

    expect(sentMessages[0].cacheTypes).toEqual(['entity', 'relationship']);
  });

  it('ignores messages without matching requestId', async () => {
    const { result } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    // Send a message with different requestId
    act(() => {
      mockWs.mockServerMessage({
        ...mockCacheRebuildEvents.progress,
        requestId: 'different-request-id'
      });
    });

    // Should not call onStateChange
    expect(mockOnStateChange).not.toHaveBeenCalled();
  });

  it('handles WebSocket reconnection', async () => {
    const { result, rerender } = renderHook(() => 
      useCacheRebuild({ onStateChange: mockOnStateChange })
    );

    // Simulate disconnection
    mockWs.readyState = WebSocket.CLOSED;
    expect(result.current.isConnected()).toBe(false);

    // Simulate reconnection
    mockWs.readyState = WebSocket.OPEN;
    rerender();
    
    expect(result.current.isConnected()).toBe(true);
  });
});