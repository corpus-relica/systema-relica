import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SelectionDetails from '../index';
import { MockWebSocket } from '../../../tests/setup/websocketMock';
import { setupMockWebSocket, cleanupMockWebSocket } from '../../../tests/helpers/cacheTestHelpers';

// Mock react-admin
jest.mock('react-admin', () => ({
  useStore: jest.fn()
}));

// Mock the PortalClient
jest.mock('../../../io/PortalClient.js', () => ({
  portalClient: {
    getEntityType: jest.fn()
  }
}));

// Mock child components
jest.mock('../KindDetails/index.js', () => {
  return function MockKindDetails() {
    return <div data-testid="kind-details">Kind Details Component</div>;
  };
});

jest.mock('../IndividualDetails/index.js', () => {
  return function MockIndividualDetails() {
    return <div data-testid="individual-details">Individual Details Component</div>;
  };
});

describe('SelectionDetails', () => {
  let mockWs: MockWebSocket;
  let mockUseStore: jest.Mock;
  let mockPortalClient: any;
  let queryClient: QueryClient;

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    mockUseStore = jest.fn();
    mockPortalClient = {
      getEntityType: jest.fn()
    };

    const { useStore } = require('react-admin');
    useStore.mockImplementation(mockUseStore);

    const { portalClient } = require('../../../io/PortalClient.js');
    Object.assign(portalClient, mockPortalClient);
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('No Selection State', () => {
    it('displays no entity selected message when no node is selected', () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [null];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      renderWithQueryClient(<SelectionDetails />);

      expect(screen.getByText('No entity selected')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('displays loading message while fetching entity type', () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [123];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      mockPortalClient.getEntityType.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ type: 'kind' }), 100))
      );

      renderWithQueryClient(<SelectionDetails />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when API call fails', async () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [123];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      const errorMessage = 'Failed to fetch entity type';
      mockPortalClient.getEntityType.mockRejectedValue(new Error(errorMessage));

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });
  });

  describe('Integer Entity Handling', () => {
    it('displays integer entity for UIDs >= 5000000000', async () => {
      const integerUid = 5000000001;
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [integerUid];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByText(`Integer:${integerUid}`)).toBeInTheDocument();
      });

      // Should not call API for integer entities
      expect(mockPortalClient.getEntityType).not.toHaveBeenCalled();
    });

    it('handles edge case at integer boundary', async () => {
      const boundaryUid = 5000000000;
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [boundaryUid];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByText(`Integer:${boundaryUid}`)).toBeInTheDocument();
      });
    });
  });

  describe('Kind Entity Handling', () => {
    it('renders KindDetails for kind entity type', async () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [123];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      mockPortalClient.getEntityType.mockResolvedValue({ type: 'kind' });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('kind-details')).toBeInTheDocument();
        expect(screen.getByText('Kind Details Component')).toBeInTheDocument();
      });

      expect(mockPortalClient.getEntityType).toHaveBeenCalledWith(123);
    });

    it('renders KindDetails for qualification entity type', async () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [456];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      mockPortalClient.getEntityType.mockResolvedValue({ type: 'qualification' });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('kind-details')).toBeInTheDocument();
        expect(screen.getByText('Kind Details Component')).toBeInTheDocument();
      });

      expect(mockPortalClient.getEntityType).toHaveBeenCalledWith(456);
    });
  });

  describe('Individual Entity Handling', () => {
    it('renders IndividualDetails for individual entity type', async () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [789];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      mockPortalClient.getEntityType.mockResolvedValue({ type: 'individual' });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('individual-details')).toBeInTheDocument();
        expect(screen.getByText('Individual Details Component')).toBeInTheDocument();
      });

      expect(mockPortalClient.getEntityType).toHaveBeenCalledWith(789);
    });
  });

  describe('Unknown Entity Type Handling', () => {
    it('displays unknown entity type message for unrecognized types', async () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [999];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPortalClient.getEntityType.mockResolvedValue({ type: 'unknown' });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByText('Unknown entity type')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Unknown entity type');
      expect(consoleSpy).toHaveBeenCalledWith({ type: 'unknown' });

      consoleSpy.mockRestore();
    });

    it('handles null entity type response', async () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [999];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      mockPortalClient.getEntityType.mockResolvedValue({ type: null });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(screen.getByText('Unknown entity type')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Unknown entity type');
      expect(consoleSpy).toHaveBeenCalledWith({ type: null });

      consoleSpy.mockRestore();
    });
  });

  describe('Query Behavior', () => {
    it('does not fetch entity type for null selectedNode', () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [null];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      renderWithQueryClient(<SelectionDetails />);

      expect(mockPortalClient.getEntityType).not.toHaveBeenCalled();
    });

    it('does not fetch entity type for integer UIDs', () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [5000000001];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      renderWithQueryClient(<SelectionDetails />);

      expect(mockPortalClient.getEntityType).not.toHaveBeenCalled();
    });

    it('fetches entity type for valid non-integer UIDs', async () => {
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [123];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      mockPortalClient.getEntityType.mockResolvedValue({ type: 'kind' });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(mockPortalClient.getEntityType).toHaveBeenCalledWith(123);
      });
    });
  });

  describe('Store Integration', () => {
    it('correctly reads selectedNode from store', async () => {
      const selectedNodeValue = 456;
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [selectedNodeValue];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      mockPortalClient.getEntityType.mockResolvedValue({ type: 'individual' });

      renderWithQueryClient(<SelectionDetails />);

      await waitFor(() => {
        expect(mockPortalClient.getEntityType).toHaveBeenCalledWith(selectedNodeValue);
      });
    });

    it('correctly reads selectedEdge from store', () => {
      const selectedEdgeValue = 789;
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [null];
        if (key === 'selectedEdge') return [selectedEdgeValue];
        return [null];
      });

      renderWithQueryClient(<SelectionDetails />);

      // Should still show no entity selected since selectedNode is null
      expect(screen.getByText('No entity selected')).toBeInTheDocument();
    });
  });

  describe('Component Lifecycle', () => {
    it('updates when selectedNode changes', async () => {
      const { rerender } = renderWithQueryClient(<SelectionDetails />);

      // Initially no selection
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [null];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      rerender(
        <QueryClientProvider client={queryClient}>
          <SelectionDetails />
        </QueryClientProvider>
      );

      expect(screen.getByText('No entity selected')).toBeInTheDocument();

      // Change to have a selection
      mockUseStore.mockImplementation((key: string) => {
        if (key === 'selectedNode') return [123];
        if (key === 'selectedEdge') return [null];
        return [null];
      });

      mockPortalClient.getEntityType.mockResolvedValue({ type: 'kind' });

      rerender(
        <QueryClientProvider client={queryClient}>
          <SelectionDetails />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('kind-details')).toBeInTheDocument();
      });
    });
  });

  it('takes a snapshot with no selection', () => {
    mockUseStore.mockImplementation((key: string) => {
      if (key === 'selectedNode') return [null];
      if (key === 'selectedEdge') return [null];
      return [null];
    });

    const { container } = renderWithQueryClient(<SelectionDetails />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot with integer entity', () => {
    mockUseStore.mockImplementation((key: string) => {
      if (key === 'selectedNode') return [5000000001];
      if (key === 'selectedEdge') return [null];
      return [null];
    });

    const { container } = renderWithQueryClient(<SelectionDetails />);
    expect(container).toMatchSnapshot();
  });
});