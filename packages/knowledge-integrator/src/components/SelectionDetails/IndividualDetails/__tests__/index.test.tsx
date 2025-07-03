import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IndividualDetails from '../index';
import { MockWebSocket } from '../../../../tests/setup/websocketMock';
import { setupMockWebSocket, cleanupMockWebSocket } from '../../../../tests/helpers/cacheTestHelpers';

// Mock react-admin
jest.mock('react-admin', () => ({
  useStore: jest.fn()
}));

// Mock the PortalClient
jest.mock('../../../../io/PortalClient.js', () => ({
  portalClient: {
    retrieveIndividualModel: jest.fn()
  }
}));

// Mock MUI components
jest.mock('@mui/material/Grid', () => {
  return function MockGrid({ children, ...props }: any) {
    return <div data-testid="grid" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, ...props }: any) {
    return <div data-testid="box" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Stack', () => {
  return function MockStack({ children, direction, spacing, ...props }: any) {
    return (
      <div data-testid="stack" data-direction={direction} data-spacing={spacing} {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, size, style, ...props }: any) {
    return (
      <div data-testid="typography" data-size={size} style={style} {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/IconButton', () => {
  return function MockIconButton({ children, onClick, ...props }: any) {
    return (
      <button data-testid="icon-button" onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('@mui/icons-material/FileCopy', () => {
  return function MockCopyAllIcon() {
    return <div data-testid="copy-icon">Copy Icon</div>;
  };
});

// Mock display components
jest.mock('../display/Collection', () => {
  return function MockCollection(props: any) {
    return <div data-testid="collection">Collection Component</div>;
  };
});

jest.mock('../../display/IndividualName', () => {
  return function MockIndividualName(props: any) {
    return <div data-testid="individual-name">Individual Name: {props.name}</div>;
  };
});

jest.mock('../../display/Classification', () => {
  return function MockClassification(props: any) {
    return (
      <div data-testid="classification">
        Classification - UIDs: {props.uids?.join(', ')}, Individual: {props.individualUID}
      </div>
    );
  };
});

jest.mock('../../display/Value', () => {
  return function MockValue(props: any) {
    return <div data-testid="value">Value: {props.value}</div>;
  };
});

jest.mock('../../display/Definition', () => {
  return function MockDefinition(props: any) {
    return <div data-testid="definition">Definition Component</div>;
  };
});

jest.mock('../../display/Synonyms', () => {
  return function MockSynonyms(props: any) {
    return <div data-testid="synonyms">Synonyms Component</div>;
  };
});

jest.mock('../../../pages/Workflows/WorkflowFactsVisualizer', () => {
  return function MockWorkflowFactsVisualizer(props: any) {
    return <div data-testid="workflow-facts-visualizer">Workflow Facts Visualizer</div>;
  };
});

// Mock category-specific components
jest.mock('../PhysicalObject.js', () => {
  return function MockIndividualPhysicalObjectDetails(props: any) {
    return (
      <div data-testid="physical-object-details">
        Physical Object Details - UID: {props.uid}
      </div>
    );
  };
});

jest.mock('../Aspect.js', () => {
  return function MockIndividualAspectDetails(props: any) {
    return (
      <div data-testid="aspect-details">
        Aspect Details - UID: {props.uid}
      </div>
    );
  };
});

jest.mock('../Relation.js', () => {
  return function MockIndividualRelationDetails(props: any) {
    return (
      <div data-testid="relation-details">
        Relation Details - UID: {props.uid}
      </div>
    );
  };
});

jest.mock('../Occurrence.js', () => {
  return function MockIndividualOccurrenceDetails(props: any) {
    return (
      <div data-testid="occurrence-details">
        Occurrence Details - UID: {props.uid}
      </div>
    );
  };
});

describe('IndividualDetails', () => {
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

  const mockIndividualData = {
    uid: 123,
    name: 'Test Individual',
    nature: 'individual',
    category: 'physical object',
    classifiers: [456, 789]
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
      retrieveIndividualModel: jest.fn()
    };

    const { useStore } = require('react-admin');
    useStore.mockImplementation(mockUseStore);

    const { portalClient } = require('../../../../io/PortalClient.js');
    Object.assign(portalClient, mockPortalClient);

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    });
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Loading and Error States', () => {
    it('displays loading message when no selectedNode', () => {
      mockUseStore.mockReturnValue([null]);

      renderWithQueryClient(<IndividualDetails />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays loading message while fetching data', () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockIndividualData), 100))
      );

      renderWithQueryClient(<IndividualDetails />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays error message when API call fails', async () => {
      mockUseStore.mockReturnValue([123]);
      const errorMessage = 'Failed to fetch individual model';
      mockPortalClient.retrieveIndividualModel.mockRejectedValue(new Error(errorMessage));

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Rendering', () => {
    beforeEach(() => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(mockIndividualData);
    });

    it('renders basic individual information', async () => {
      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByText('123:Test Individual')).toBeInTheDocument();
      });

      expect(screen.getByTestId('classification')).toBeInTheDocument();
      expect(screen.getByText('Classification - UIDs: 456, 789, Individual: 123')).toBeInTheDocument();
    });

    it('renders stack layout correctly', async () => {
      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('stack')).toBeInTheDocument();
      });

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveAttribute('data-direction', 'column');
      expect(stack).toHaveAttribute('data-spacing', '1');
    });

    it('renders typography with correct styling', async () => {
      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        const typography = screen.getByTestId('typography');
        expect(typography).toHaveStyle({
          fontWeight: '800',
          color: 'black'
        });
      });
    });
  });

  describe('Category-specific Components', () => {
    it('renders PhysicalObjectDetails for physical object category', async () => {
      const physicalObjectData = { ...mockIndividualData, category: 'physical object' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(physicalObjectData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('physical-object-details')).toBeInTheDocument();
        expect(screen.getByText('Physical Object Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders AspectDetails for aspect category', async () => {
      const aspectData = { ...mockIndividualData, category: 'aspect' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(aspectData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('aspect-details')).toBeInTheDocument();
        expect(screen.getByText('Aspect Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders RelationDetails for relation category', async () => {
      const relationData = { ...mockIndividualData, category: 'relation' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(relationData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('relation-details')).toBeInTheDocument();
        expect(screen.getByText('Relation Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders OccurrenceDetails for occurrence category', async () => {
      const occurrenceData = { ...mockIndividualData, category: 'occurrence' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(occurrenceData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('occurrence-details')).toBeInTheDocument();
        expect(screen.getByText('Occurrence Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders unknown category message for unrecognized categories', async () => {
      const unknownData = { ...mockIndividualData, category: 'unknown' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(unknownData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByText('Unknown Entity Category: unknown')).toBeInTheDocument();
      });
    });
  });

  describe('Data Handling', () => {
    it('handles empty classifiers array', async () => {
      const dataWithEmptyClassifiers = { ...mockIndividualData, classifiers: [] };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(dataWithEmptyClassifiers);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByText('Classification - UIDs: , Individual: 123')).toBeInTheDocument();
      });
    });

    it('handles missing name field', async () => {
      const dataWithoutName = { ...mockIndividualData, name: undefined };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(dataWithoutName);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByText('123:undefined')).toBeInTheDocument();
      });
    });

    it('handles different uid values', async () => {
      const dataWithDifferentUid = { ...mockIndividualData, uid: 999, name: 'Different Individual' };
      mockUseStore.mockReturnValue([999]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(dataWithDifferentUid);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByText('999:Different Individual')).toBeInTheDocument();
        expect(screen.getByText('Classification - UIDs: 456, 789, Individual: 999')).toBeInTheDocument();
      });
    });
  });

  describe('Query Behavior', () => {
    it('does not fetch data when selectedNode is null', () => {
      mockUseStore.mockReturnValue([null]);

      renderWithQueryClient(<IndividualDetails />);

      expect(mockPortalClient.retrieveIndividualModel).not.toHaveBeenCalled();
    });

    it('fetches data when selectedNode is provided', async () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(mockIndividualData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(mockPortalClient.retrieveIndividualModel).toHaveBeenCalledWith(123);
      });
    });

    it('refetches data when selectedNode changes', async () => {
      const { rerender } = renderWithQueryClient(<IndividualDetails />);

      // Initial call
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(mockIndividualData);

      rerender(
        <QueryClientProvider client={queryClient}>
          <IndividualDetails />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockPortalClient.retrieveIndividualModel).toHaveBeenCalledWith(123);
      });

      // Change selectedNode
      const newData = { ...mockIndividualData, uid: 456, name: 'New Individual' };
      mockUseStore.mockReturnValue([456]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(newData);

      rerender(
        <QueryClientProvider client={queryClient}>
          <IndividualDetails />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockPortalClient.retrieveIndividualModel).toHaveBeenCalledWith(456);
      });
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to Classification component', async () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(mockIndividualData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('classification')).toBeInTheDocument();
      });
    });

    it('passes all data to category-specific components', async () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveIndividualModel.mockResolvedValue(mockIndividualData);

      renderWithQueryClient(<IndividualDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('physical-object-details')).toBeInTheDocument();
      });
    });
  });

  it('takes a snapshot with physical object data', async () => {
    mockUseStore.mockReturnValue([123]);
    mockPortalClient.retrieveIndividualModel.mockResolvedValue(mockIndividualData);

    const { container } = renderWithQueryClient(<IndividualDetails />);

    await waitFor(() => {
      expect(screen.getByText('123:Test Individual')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot with loading state', () => {
    mockUseStore.mockReturnValue([null]);

    const { container } = renderWithQueryClient(<IndividualDetails />);
    expect(container).toMatchSnapshot();
  });
});