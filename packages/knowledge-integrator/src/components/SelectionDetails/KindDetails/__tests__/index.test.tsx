import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import KindDetails from '../index';
import { MockWebSocket } from '../../../../tests/setup/websocketMock';
import { setupMockWebSocket, cleanupMockWebSocket } from '../../../../tests/helpers/cacheTestHelpers';

// Mock react-admin
jest.mock('react-admin', () => ({
  useStore: jest.fn()
}));

// Mock the PortalClient
jest.mock('../../../../io/PortalClient.js', () => ({
  portalClient: {
    retrieveKindModel: jest.fn()
  }
}));

// Mock the socket module
jest.mock('../../../../socket.js', () => ({
  sockSendCC: jest.fn()
}));

// Mock MUI components
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

jest.mock('@mui/icons-material/CopyAll', () => {
  return function MockCopyAllIcon() {
    return <div data-testid="copy-all-icon">Copy All Icon</div>;
  };
});

// Mock Table components
jest.mock('@mui/material/Table', () => {
  return function MockTable({ children, ...props }: any) {
    return <div data-testid="table" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/TableBody', () => {
  return function MockTableBody({ children, ...props }: any) {
    return <div data-testid="table-body" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/TableCell', () => {
  return function MockTableCell({ children, ...props }: any) {
    return <div data-testid="table-cell" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/TableContainer', () => {
  return function MockTableContainer({ children, ...props }: any) {
    return <div data-testid="table-container" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/TableHead', () => {
  return function MockTableHead({ children, ...props }: any) {
    return <div data-testid="table-head" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/TableRow', () => {
  return function MockTableRow({ children, ...props }: any) {
    return <div data-testid="table-row" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Paper', () => {
  return function MockPaper({ children, ...props }: any) {
    return <div data-testid="paper" {...props}>{children}</div>;
  };
});

// Mock display components
jest.mock('../../display/Specialization.js', () => {
  return function MockSpecialization(props: any) {
    return (
      <div data-testid="specialization">
        Specialization - UIDs: {props.uids?.join(', ')}, Child: {props.childUID}
      </div>
    );
  };
});

jest.mock('../../display/Definition.js', () => {
  return function MockDefinition(props: any) {
    return (
      <div data-testid="definition">
        Definition - Count: {props.definitions?.length}
      </div>
    );
  };
});

jest.mock('../../display/PossibleRole.js', () => {
  return function MockPossibleRole(props: any) {
    return (
      <div data-testid="possible-role">
        Possible Role - UID: {props.uid}, Roleplayer: {props.roleplayerUID}
      </div>
    );
  };
});

jest.mock('../../display/Synonyms.js', () => {
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
  return function MockPhysicalObjectKindDetails(props: any) {
    return (
      <div data-testid="physical-object-kind-details">
        Physical Object Kind Details - UID: {props.uid}
      </div>
    );
  };
});

jest.mock('../Aspect.js', () => {
  return function MockAspectKindDetails(props: any) {
    return (
      <div data-testid="aspect-kind-details">
        Aspect Kind Details - UID: {props.uid}
      </div>
    );
  };
});

jest.mock('../Role.js', () => {
  return function MockRoleKindDetails(props: any) {
    return (
      <div data-testid="role-kind-details">
        Role Kind Details - UID: {props.uid}
      </div>
    );
  };
});

jest.mock('../Relation.js', () => {
  return function MockRelationKindDetails(props: any) {
    return (
      <div data-testid="relation-kind-details">
        Relation Kind Details - UID: {props.uid}
      </div>
    );
  };
});

jest.mock('../Occurrence.js', () => {
  return function MockOccurrenceKindDetails(props: any) {
    return (
      <div data-testid="occurrence-kind-details">
        Occurrence Kind Details - UID: {props.uid}
      </div>
    );
  };
});

describe('KindDetails', () => {
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

  const mockKindData = {
    uid: 123,
    name: 'Test Kind',
    nature: 'kind',
    category: 'physical object',
    supertypes: [456, 789],
    definitions: ['This is a test definition', 'Another definition'],
    synonyms: ['synonym1', 'synonym2']
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
      retrieveKindModel: jest.fn()
    };

    const { useStore } = require('react-admin');
    useStore.mockImplementation(mockUseStore);

    const { portalClient } = require('../../../../io/PortalClient.js');
    Object.assign(portalClient, mockPortalClient);
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
    queryClient.clear();
  });

  describe('Loading and Error States', () => {
    it('displays no node selected message when no selectedNode', () => {
      mockUseStore.mockReturnValue([null]);

      renderWithQueryClient(<KindDetails />);

      expect(screen.getByText('No node selected')).toBeInTheDocument();
    });

    it('displays loading message while fetching data', () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockKindData), 100))
      );

      renderWithQueryClient(<KindDetails />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('displays error message when API call fails', async () => {
      mockUseStore.mockReturnValue([123]);
      const errorMessage = 'Failed to fetch kind model';
      mockPortalClient.retrieveKindModel.mockRejectedValue(new Error(errorMessage));

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('displays no definitions found when definitions are missing', async () => {
      mockUseStore.mockReturnValue([123]);
      const dataWithoutDefinitions = { ...mockKindData, definitions: null };
      mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithoutDefinitions);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('No definitions found')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Rendering', () => {
    beforeEach(() => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(mockKindData);
    });

    it('renders basic kind information', async () => {
      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('123:Test Kind')).toBeInTheDocument();
        expect(screen.getByText('physical object')).toBeInTheDocument();
      });
    });

    it('renders stack layout correctly', async () => {
      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('stack')).toBeInTheDocument();
      });

      const stack = screen.getByTestId('stack');
      expect(stack).toHaveAttribute('data-direction', 'column');
      expect(stack).toHaveAttribute('data-spacing', '1');
    });

    it('renders typography with correct styling', async () => {
      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        const typography = screen.getByTestId('typography');
        expect(typography).toHaveStyle({
          fontWeight: '800',
          color: 'black'
        });
      });
    });

    it('renders specialization component with correct props', async () => {
      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('specialization')).toBeInTheDocument();
        expect(screen.getByText('Specialization - UIDs: 456, 789, Child: 123')).toBeInTheDocument();
      });
    });

    it('renders definition component with transformed definitions', async () => {
      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('definition')).toBeInTheDocument();
        expect(screen.getByText('Definition - Count: 2')).toBeInTheDocument();
      });
    });

    it('renders synonyms when present', async () => {
      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('synonym1')).toBeInTheDocument();
        expect(screen.getByText('synonym2')).toBeInTheDocument();
      });
    });

    it('does not render synonyms when not present', async () => {
      const dataWithoutSynonyms = { ...mockKindData, synonyms: null };
      mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithoutSynonyms);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.queryByText('synonym1')).not.toBeInTheDocument();
      });
    });

    it('does not render synonyms when empty array', async () => {
      const dataWithEmptySynonyms = { ...mockKindData, synonyms: [] };
      mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithEmptySynonyms);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.queryByText('synonym1')).not.toBeInTheDocument();
      });
    });
  });

  describe('Category-specific Components', () => {
    it('renders PhysicalObjectKindDetails for physical object category', async () => {
      const physicalObjectData = { ...mockKindData, category: 'physical object' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(physicalObjectData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('physical-object-kind-details')).toBeInTheDocument();
        expect(screen.getByText('Physical Object Kind Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders AspectKindDetails for aspect category', async () => {
      const aspectData = { ...mockKindData, category: 'aspect' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(aspectData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('aspect-kind-details')).toBeInTheDocument();
        expect(screen.getByText('Aspect Kind Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders RoleKindDetails for role category', async () => {
      const roleData = { ...mockKindData, category: 'role' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(roleData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('role-kind-details')).toBeInTheDocument();
        expect(screen.getByText('Role Kind Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders RelationKindDetails for relation category', async () => {
      const relationData = { ...mockKindData, category: 'relation' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(relationData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('relation-kind-details')).toBeInTheDocument();
        expect(screen.getByText('Relation Kind Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders OccurrenceKindDetails for occurrence category', async () => {
      const occurrenceData = { ...mockKindData, category: 'occurrence' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(occurrenceData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('occurrence-kind-details')).toBeInTheDocument();
        expect(screen.getByText('Occurrence Kind Details - UID: 123')).toBeInTheDocument();
      });
    });

    it('renders unknown category message for unrecognized categories', async () => {
      const unknownData = { ...mockKindData, category: 'unknown' };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(unknownData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('Unknown Entity Category: unknown')).toBeInTheDocument();
      });
    });
  });

  describe('Data Handling', () => {
    it('handles empty supertypes array', async () => {
      const dataWithEmptySupertypes = { ...mockKindData, supertypes: [] };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithEmptySupertypes);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('Specialization - UIDs: , Child: 123')).toBeInTheDocument();
      });
    });

    it('handles missing name field', async () => {
      const dataWithoutName = { ...mockKindData, name: undefined };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithoutName);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('123:undefined')).toBeInTheDocument();
      });
    });

    it('handles different uid values', async () => {
      const dataWithDifferentUid = { ...mockKindData, uid: 999, name: 'Different Kind' };
      mockUseStore.mockReturnValue([999]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithDifferentUid);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('999:Different Kind')).toBeInTheDocument();
        expect(screen.getByText('Specialization - UIDs: 456, 789, Child: 999')).toBeInTheDocument();
      });
    });

    it('transforms definitions correctly', async () => {
      const dataWithSingleDefinition = { ...mockKindData, definitions: ['Single definition'] };
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithSingleDefinition);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByText('Definition - Count: 1')).toBeInTheDocument();
      });
    });
  });

  describe('Query Behavior', () => {
    it('does not fetch data when selectedNode is null', () => {
      mockUseStore.mockReturnValue([null]);

      renderWithQueryClient(<KindDetails />);

      expect(mockPortalClient.retrieveKindModel).not.toHaveBeenCalled();
    });

    it('fetches data when selectedNode is provided', async () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(mockKindData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(mockPortalClient.retrieveKindModel).toHaveBeenCalledWith(123);
      });
    });

    it('refetches data when selectedNode changes', async () => {
      const { rerender } = renderWithQueryClient(<KindDetails />);

      // Initial call
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(mockKindData);

      rerender(
        <QueryClientProvider client={queryClient}>
          <KindDetails />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockPortalClient.retrieveKindModel).toHaveBeenCalledWith(123);
      });

      // Change selectedNode
      const newData = { ...mockKindData, uid: 456, name: 'New Kind' };
      mockUseStore.mockReturnValue([456]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(newData);

      rerender(
        <QueryClientProvider client={queryClient}>
          <KindDetails />
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(mockPortalClient.retrieveKindModel).toHaveBeenCalledWith(456);
      });
    });
  });

  describe('Component Integration', () => {
    it('passes correct props to Specialization component', async () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(mockKindData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('specialization')).toBeInTheDocument();
      });
    });

    it('passes all data to category-specific components', async () => {
      mockUseStore.mockReturnValue([123]);
      mockPortalClient.retrieveKindModel.mockResolvedValue(mockKindData);

      renderWithQueryClient(<KindDetails />);

      await waitFor(() => {
        expect(screen.getByTestId('physical-object-kind-details')).toBeInTheDocument();
      });
    });
  });

  it('takes a snapshot with physical object data', async () => {
    mockUseStore.mockReturnValue([123]);
    mockPortalClient.retrieveKindModel.mockResolvedValue(mockKindData);

    const { container } = renderWithQueryClient(<KindDetails />);

    await waitFor(() => {
      expect(screen.getByText('123:Test Kind')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot with no node selected', () => {
    mockUseStore.mockReturnValue([null]);

    const { container } = renderWithQueryClient(<KindDetails />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot with no definitions', async () => {
    mockUseStore.mockReturnValue([123]);
    const dataWithoutDefinitions = { ...mockKindData, definitions: null };
    mockPortalClient.retrieveKindModel.mockResolvedValue(dataWithoutDefinitions);

    const { container } = renderWithQueryClient(<KindDetails />);

    await waitFor(() => {
      expect(screen.getByText('No definitions found')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});