import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import CacheManagementSection from '../../components/Settings/CacheManagement';
import { MockWebSocket } from '../setup/websocketMock';
import { mockCacheRebuildEvents, mockAuthState } from '../setup/cacheMockData';
import { setupMockWebSocket, cleanupMockWebSocket, simulateCacheRebuildFlow } from '../helpers/cacheTestHelpers';

// Mock the socket module
jest.mock('../../socket', () => ({
  getWebSocket: jest.fn()
}));

// Mock auth context
jest.mock('../../context/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('Cache Rebuild Integration Tests', () => {
  let mockWs: MockWebSocket;

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    
    const { getWebSocket } = require('../../socket');
    getWebSocket.mockReturnValue(mockWs);
    
    const { useAuth } = require('../../context/AuthContext');
    useAuth.mockReturnValue(mockAuthState);
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
  });

  it('completes full cache rebuild flow successfully', async () => {
    render(<CacheManagementSection />);
    
    // Select cache type
    const allCachesCheckbox = screen.getByLabelText('All Caches');
    fireEvent.click(allCachesCheckbox);
    
    // Start rebuild
    const rebuildButton = screen.getByRole('button', { name: /rebuild cache/i });
    fireEvent.click(rebuildButton);
    
    // Verify request was sent
    await waitFor(() => {
      const messages = mockWs.listeners('send')[0];
      expect(messages).toBeDefined();
    });
    
    // Simulate server responses
    await act(async () => {
      // Initial response
      mockWs.mockServerMessage(mockCacheRebuildEvents.initResponse);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Progress updates
      mockWs.mockServerMessage({
        ...mockCacheRebuildEvents.progress,
        progress: 25,
        detail: 'Processed 250/1000 entities'
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      
      mockWs.mockServerMessage({
        ...mockCacheRebuildEvents.progress,
        progress: 50,
        detail: 'Processed 500/1000 entities'
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      
      mockWs.mockServerMessage({
        ...mockCacheRebuildEvents.progress,
        progress: 75,
        detail: 'Processed 750/1000 entities'
      });
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Completion
      mockWs.mockServerMessage(mockCacheRebuildEvents.completion);
    });
    
    // Verify UI updates
    await waitFor(() => {
      expect(screen.getByText(/Cache rebuild completed successfully/i)).toBeInTheDocument();
    });
    
    // Verify button is enabled again
    expect(rebuildButton).not.toBeDisabled();
  });

  it('handles cache rebuild errors gracefully', async () => {
    render(<CacheManagementSection />);
    
    // Select cache type and start rebuild
    fireEvent.click(screen.getByLabelText('Entity Cache'));
    fireEvent.click(screen.getByRole('button', { name: /rebuild cache/i }));
    
    // Simulate error response
    await act(async () => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.initResponse);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      mockWs.mockServerMessage(mockCacheRebuildEvents.error);
    });
    
    // Verify error is displayed
    await waitFor(() => {
      expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    });
    
    // Verify rebuild can be retried
    const rebuildButton = screen.getByRole('button', { name: /rebuild cache/i });
    expect(rebuildButton).not.toBeDisabled();
  });

  it('handles unauthorized access', async () => {
    // Mock non-admin user
    const { useAuth } = require('../../context/AuthContext');
    useAuth.mockReturnValue({ ...mockAuthState, isAdmin: false });
    
    render(<CacheManagementSection />);
    
    // Try to rebuild cache
    fireEvent.click(screen.getByLabelText('All Caches'));
    fireEvent.click(screen.getByRole('button', { name: /rebuild cache/i }));
    
    // Simulate unauthorized response
    await act(async () => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.unauthorized);
    });
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/Admin privileges required/i)).toBeInTheDocument();
    });
  });

  it('allows canceling cache rebuild', async () => {
    render(<CacheManagementSection />);
    
    // Start rebuild
    fireEvent.click(screen.getByLabelText('All Caches'));
    fireEvent.click(screen.getByRole('button', { name: /rebuild cache/i }));
    
    // Wait for rebuild to start
    await act(async () => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.initResponse);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      mockWs.mockServerMessage({
        ...mockCacheRebuildEvents.progress,
        progress: 30
      });
    });
    
    // Cancel rebuild
    const cancelButton = await screen.findByText(/cancel rebuild/i);
    fireEvent.click(cancelButton);
    
    // Verify cancel request was sent
    await waitFor(() => {
      const sentMessages = mockWs.listeners('send');
      expect(sentMessages.length).toBeGreaterThan(0);
    });
    
    // Simulate cancellation response
    await act(async () => {
      mockWs.mockServerMessage({
        type: 'cache-rebuild-cancelled',
        requestId: 'test-request-1'
      });
    });
    
    // Verify UI returns to initial state
    await waitFor(() => {
      expect(screen.queryByText(/cancel rebuild/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rebuild cache/i })).not.toBeDisabled();
    });
  });

  it('handles WebSocket disconnection during rebuild', async () => {
    render(<CacheManagementSection />);
    
    // Start rebuild
    fireEvent.click(screen.getByLabelText('All Caches'));
    fireEvent.click(screen.getByRole('button', { name: /rebuild cache/i }));
    
    await act(async () => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.initResponse);
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Simulate progress
      mockWs.mockServerMessage({
        ...mockCacheRebuildEvents.progress,
        progress: 40
      });
    });
    
    // Simulate WebSocket disconnection
    act(() => {
      mockWs.readyState = WebSocket.CLOSED;
      mockWs.emit('close');
    });
    
    // Verify error message
    await waitFor(() => {
      expect(screen.getByText(/WebSocket connection lost/i)).toBeInTheDocument();
    });
  });

  it('handles multiple cache type selection', async () => {
    render(<CacheManagementSection />);
    
    // Select multiple cache types
    fireEvent.click(screen.getByLabelText('Entity Cache'));
    fireEvent.click(screen.getByLabelText('Relationship Cache'));
    
    // Start rebuild
    fireEvent.click(screen.getByRole('button', { name: /rebuild cache/i }));
    
    // Verify request includes both cache types
    const sentMessages: any[] = [];
    mockWs.on('send', (data) => sentMessages.push(data));
    
    await waitFor(() => {
      expect(sentMessages[0]).toMatchObject({
        type: 'cache-rebuild-request',
        cacheTypes: expect.arrayContaining(['entity', 'relationship'])
      });
    });
  });

  it('displays real-time progress updates', async () => {
    render(<CacheManagementSection />);
    
    // Start rebuild
    fireEvent.click(screen.getByLabelText('All Caches'));
    fireEvent.click(screen.getByRole('button', { name: /rebuild cache/i }));
    
    // Simulate progressive updates
    const progressSteps = [10, 25, 50, 75, 90, 100];
    
    for (const progress of progressSteps) {
      await act(async () => {
        mockWs.mockServerMessage({
          type: 'cache-rebuild-progress',
          requestId: 'test-request-1',
          progress,
          stage: `Processing (${progress}%)`,
          detail: `Processed ${progress * 10}/1000 items`
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      });
      
      await waitFor(() => {
        expect(screen.getByText(`${progress}%`)).toBeInTheDocument();
      });
    }
    
    // Verify completion
    await act(async () => {
      mockWs.mockServerMessage(mockCacheRebuildEvents.completion);
    });
    
    await waitFor(() => {
      expect(screen.getByText(/completed successfully/i)).toBeInTheDocument();
    });
  });

  it('persists selected cache types between rebuilds', async () => {
    render(<CacheManagementSection />);
    
    // Select specific cache types
    fireEvent.click(screen.getByLabelText('Entity Cache'));
    fireEvent.click(screen.getByLabelText('Relationship Cache'));
    
    // Complete a rebuild
    fireEvent.click(screen.getByRole('button', { name: /rebuild cache/i }));
    
    await act(async () => {
      await simulateCacheRebuildFlow(mockWs, { progressUpdates: 1 });
    });
    
    // Verify selections are maintained
    await waitFor(() => {
      expect(screen.getByLabelText('Entity Cache')).toBeChecked();
      expect(screen.getByLabelText('Relationship Cache')).toBeChecked();
      expect(screen.getByLabelText('All Caches')).not.toBeChecked();
    });
  });
});