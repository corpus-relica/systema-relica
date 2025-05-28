import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CacheManagementSection from '../index';
import { MockWebSocket } from '../../../../tests/setup/websocketMock';
import { mockCacheRebuildEvents } from '../../../../tests/setup/cacheMockData';
import { setupMockWebSocket, cleanupMockWebSocket } from '../../../../tests/helpers/cacheTestHelpers';

// Mock the useCacheRebuild hook
jest.mock('../hooks/useCacheRebuild', () => ({
  useCacheRebuild: jest.fn()
}));

describe('CacheManagementSection', () => {
  let mockWs: MockWebSocket;
  let mockStartCacheRebuild: jest.Mock;
  let mockCancelCacheRebuild: jest.Mock;
  let mockIsConnected: jest.Mock;

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    mockStartCacheRebuild = jest.fn();
    mockCancelCacheRebuild = jest.fn();
    mockIsConnected = jest.fn().mockReturnValue(true);

    const { useCacheRebuild } = require('../hooks/useCacheRebuild');
    useCacheRebuild.mockReturnValue({
      startCacheRebuild: mockStartCacheRebuild,
      cancelCacheRebuild: mockCancelCacheRebuild,
      isConnected: mockIsConnected
    });
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
  });

  it('renders cache management section with all components', () => {
    render(<CacheManagementSection />);
    
    expect(screen.getByText('Cache Management')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rebuild cache/i })).toBeInTheDocument();
  });

  it('shows warning when WebSocket is not connected', () => {
    mockIsConnected.mockReturnValue(false);
    
    render(<CacheManagementSection />);
    
    expect(screen.getByText(/WebSocket connection not established/i)).toBeInTheDocument();
  });

  it('disables rebuild button when no cache types are selected', () => {
    render(<CacheManagementSection />);
    
    const rebuildButton = screen.getByRole('button', { name: /rebuild cache/i });
    expect(rebuildButton).toBeDisabled();
  });

  it('enables rebuild button when cache types are selected', async () => {
    render(<CacheManagementSection />);
    
    // Select a cache type (assuming the CacheTypeSelect component renders checkboxes)
    const allCachesCheckbox = screen.getByLabelText(/all caches/i);
    fireEvent.click(allCachesCheckbox);
    
    await waitFor(() => {
      const rebuildButton = screen.getByRole('button', { name: /rebuild cache/i });
      expect(rebuildButton).not.toBeDisabled();
    });
  });

  it('starts cache rebuild when button is clicked', async () => {
    render(<CacheManagementSection />);
    
    // Select cache type and click rebuild
    const allCachesCheckbox = screen.getByLabelText(/all caches/i);
    fireEvent.click(allCachesCheckbox);
    
    const rebuildButton = screen.getByRole('button', { name: /rebuild cache/i });
    fireEvent.click(rebuildButton);
    
    await waitFor(() => {
      expect(mockStartCacheRebuild).toHaveBeenCalledWith(['all']);
    });
  });

  it('shows progress indicator during rebuild', async () => {
    const { useCacheRebuild } = require('../hooks/useCacheRebuild');
    let onStateChangeCallback: any;
    
    useCacheRebuild.mockImplementation(({ onStateChange }) => {
      onStateChangeCallback = onStateChange;
      return {
        startCacheRebuild: mockStartCacheRebuild,
        cancelCacheRebuild: mockCancelCacheRebuild,
        isConnected: mockIsConnected
      };
    });
    
    render(<CacheManagementSection />);
    
    // Simulate rebuild in progress
    onStateChangeCallback({
      isRebuilding: true,
      progress: 45,
      currentPhase: 'Processing entities'
    });
    
    await waitFor(() => {
      expect(screen.getByText(/45%/)).toBeInTheDocument();
      expect(screen.getByText(/Processing entities/i)).toBeInTheDocument();
      expect(screen.getByText(/cancel rebuild/i)).toBeInTheDocument();
    });
  });

  it('handles cache rebuild errors', async () => {
    const { useCacheRebuild } = require('../hooks/useCacheRebuild');
    let onStateChangeCallback: any;
    
    useCacheRebuild.mockImplementation(({ onStateChange }) => {
      onStateChangeCallback = onStateChange;
      return {
        startCacheRebuild: mockStartCacheRebuild,
        cancelCacheRebuild: mockCancelCacheRebuild,
        isConnected: mockIsConnected
      };
    });
    
    render(<CacheManagementSection />);
    
    // Simulate error
    onStateChangeCallback({
      error: 'Database connection failed',
      isRebuilding: false
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    });
  });

  it('cancels cache rebuild when cancel button is clicked', async () => {
    const { useCacheRebuild } = require('../hooks/useCacheRebuild');
    let onStateChangeCallback: any;
    
    useCacheRebuild.mockImplementation(({ onStateChange }) => {
      onStateChangeCallback = onStateChange;
      return {
        startCacheRebuild: mockStartCacheRebuild,
        cancelCacheRebuild: mockCancelCacheRebuild,
        isConnected: mockIsConnected
      };
    });
    
    render(<CacheManagementSection />);
    
    // Start rebuild
    onStateChangeCallback({
      isRebuilding: true,
      progress: 45
    });
    
    const cancelButton = await screen.findByText(/cancel rebuild/i);
    fireEvent.click(cancelButton);
    
    expect(mockCancelCacheRebuild).toHaveBeenCalled();
  });

  it('takes a snapshot of the initial state', () => {
    const { container } = render(<CacheManagementSection />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot during rebuild', async () => {
    const { useCacheRebuild } = require('../hooks/useCacheRebuild');
    let onStateChangeCallback: any;
    
    useCacheRebuild.mockImplementation(({ onStateChange }) => {
      onStateChangeCallback = onStateChange;
      return {
        startCacheRebuild: mockStartCacheRebuild,
        cancelCacheRebuild: mockCancelCacheRebuild,
        isConnected: mockIsConnected
      };
    });
    
    const { container } = render(<CacheManagementSection />);
    
    // Simulate rebuild state
    onStateChangeCallback({
      isRebuilding: true,
      progress: 75,
      currentPhase: 'Updating relationships',
      selectedCacheTypes: ['all']
    });
    
    await waitFor(() => {
      expect(screen.getByText(/75%/)).toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });
});