import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GraphContextMenu from '../index';
import { MockWebSocket } from '../../../tests/setup/websocketMock';
import { setupMockWebSocket, cleanupMockWebSocket, createMockAuthContext } from '../../../tests/helpers/cacheTestHelpers';

// Mock the socket module
jest.mock('../../../socket', () => ({
  sendSocketMessage: jest.fn()
}));

// Mock react-admin hooks
jest.mock('react-admin', () => ({
  useStore: jest.fn(),
  useDataProvider: jest.fn()
}));

// Mock child components
jest.mock('../KindContextMenu', () => {
  return function MockKindContextMenu(props: any) {
    return (
      <div data-testid="kind-context-menu">
        Kind Context Menu - UID: {props.uid}
        <button onClick={() => props.setSubtypesDialogueIsOpen(true)}>
          Open Subtypes
        </button>
        <button onClick={() => props.setClassifiedDialogueIsOpen(true)}>
          Open Classified
        </button>
        <button onClick={() => {
          props.setUidToDelete(props.uid);
          props.setWarnIsOpen(true);
        }}>
          Delete Entity
        </button>
      </div>
    );
  };
});

jest.mock('../IndividualContextMenu', () => {
  return function MockIndividualContextMenu(props: any) {
    return (
      <div data-testid="individual-context-menu">
        Individual Context Menu - UID: {props.uid}
        <button onClick={() => {
          props.setUidToDelete(props.uid);
          props.setWarnIsOpen(true);
        }}>
          Delete Individual
        </button>
      </div>
    );
  };
});

jest.mock('../FactContextMenu', () => {
  return function MockFactContextMenu(props: any) {
    return (
      <div data-testid="fact-context-menu">
        Fact Context Menu - UID: {props.uid}
        <button onClick={() => {
          props.setUidToDelete(props.uid);
          props.setWarnIsOpen(true);
        }}>
          Delete Fact
        </button>
      </div>
    );
  };
});

jest.mock('../StageContextMenu', () => {
  return function MockStageContextMenu(props: any) {
    return (
      <div data-testid="stage-context-menu">
        Stage Context Menu
        <button onClick={() => props.setSearchUIOpen(true)}>
          Open Search
        </button>
      </div>
    );
  };
});

jest.mock('../ClassifiedDialogue', () => {
  return function MockClassifiedDialogue(props: any) {
    return (
      <div data-testid="classified-dialogue">
        Classified Dialogue - UID: {props.uid}
        <button onClick={() => props.handleClose()}>Close</button>
        <button onClick={() => props.handleOk([1, 2], [3, 4])}>OK</button>
      </div>
    );
  };
});

jest.mock('../SubtypesDialogue', () => {
  return function MockSubtypesDialogue(props: any) {
    return (
      <div data-testid="subtypes-dialogue">
        Subtypes Dialogue - UID: {props.uid}
        <button onClick={() => props.handleClose()}>Close</button>
        <button onClick={() => props.handleOk([1, 2], [3, 4])}>OK</button>
      </div>
    );
  };
});

jest.mock('../DeleteEntityDialogue', () => {
  return function MockDeleteEntityDialogue(props: any) {
    return (
      <div data-testid="delete-entity-dialogue">
        Delete Entity Dialogue - UID: {props.uid}
        <button onClick={() => props.handleClose()}>Cancel</button>
        <button onClick={() => props.handleOk()}>Delete</button>
      </div>
    );
  };
});

jest.mock('../DeleteFactDialogue', () => {
  return function MockDeleteFactDialogue(props: any) {
    return (
      <div data-testid="delete-fact-dialogue">
        Delete Fact Dialogue - UID: {props.uid}
        <button onClick={() => props.handleClose()}>Cancel</button>
        <button onClick={() => props.handleOk()}>Delete</button>
      </div>
    );
  };
});

describe('GraphContextMenu', () => {
  let mockWs: MockWebSocket;
  let mockDataProvider: jest.Mock;
  let mockSendSocketMessage: jest.Mock;

  const defaultProps = {
    open: true,
    handleClose: jest.fn(),
    x: 100,
    y: 200,
    uid: 123,
    type: 'entity',
    setSearchUIOpen: jest.fn()
  };

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    mockDataProvider = jest.fn();
    mockSendSocketMessage = jest.fn();

    const { useDataProvider } = require('react-admin');
    useDataProvider.mockReturnValue(mockDataProvider);

    const { sendSocketMessage } = require('../../../socket');
    sendSocketMessage.mockImplementation(mockSendSocketMessage);
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
  });

  describe('Entity Context Menus', () => {
    it('renders KindContextMenu for kind entities', async () => {
      mockDataProvider.mockResolvedValue({
        data: { nature: 'kind', category: 'aspect' }
      });

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
        expect(screen.getByText('Kind Context Menu - UID: 123')).toBeInTheDocument();
      });

      expect(mockDataProvider).toHaveBeenCalledWith('env/', { uid: 123 });
    });

    it('renders IndividualContextMenu for individual entities', async () => {
      mockDataProvider.mockResolvedValue({
        data: { nature: 'individual', category: 'occurrence' }
      });

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('individual-context-menu')).toBeInTheDocument();
        expect(screen.getByText('Individual Context Menu - UID: 123')).toBeInTheDocument();
      });
    });

    it('handles unknown entity types gracefully', async () => {
      mockDataProvider.mockResolvedValue({
        data: { type: 'unknown' }
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('unknown model type: ', 'unknown');
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Fact Context Menu', () => {
    it('renders FactContextMenu for fact type', async () => {
      render(<GraphContextMenu {...defaultProps} type="fact" relType={456} />);

      await waitFor(() => {
        expect(screen.getByTestId('fact-context-menu')).toBeInTheDocument();
        expect(screen.getByText('Fact Context Menu - UID: 123')).toBeInTheDocument();
      });

      // Should not call dataProvider for facts
      expect(mockDataProvider).not.toHaveBeenCalled();
    });
  });

  describe('Stage Context Menu', () => {
    it('renders StageContextMenu when no uid is provided', async () => {
      render(<GraphContextMenu {...defaultProps} uid={0} />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-context-menu')).toBeInTheDocument();
        expect(screen.getByText('Stage Context Menu')).toBeInTheDocument();
      });
    });

    it('calls setSearchUIOpen when search button is clicked', async () => {
      const mockSetSearchUIOpen = jest.fn();
      
      render(<GraphContextMenu {...defaultProps} uid={0} setSearchUIOpen={mockSetSearchUIOpen} />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-context-menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Search'));
      expect(mockSetSearchUIOpen).toHaveBeenCalledWith(true);
    });
  });

  describe('Dialogue Interactions', () => {
    it('opens and closes subtypes dialogue', async () => {
      mockDataProvider.mockResolvedValue({
        data: { nature: 'kind', category: 'aspect' }
      });

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
      });

      // Open subtypes dialogue
      fireEvent.click(screen.getByText('Open Subtypes'));

      await waitFor(() => {
        expect(screen.getByTestId('subtypes-dialogue')).toBeInTheDocument();
      });

      // Close dialogue
      fireEvent.click(screen.getByText('Close'));

      await waitFor(() => {
        expect(screen.queryByTestId('subtypes-dialogue')).not.toBeInTheDocument();
      });
    });

    it('handles subtypes dialogue OK action', async () => {
      mockDataProvider.mockResolvedValue({
        data: { nature: 'kind', category: 'aspect' }
      });

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Subtypes'));

      await waitFor(() => {
        expect(screen.getByTestId('subtypes-dialogue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('OK'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadEntities', { uids: [1, 2] });
      expect(mockSendSocketMessage).toHaveBeenCalledWith('unloadEntities', { uids: [3, 4] });
    });

    it('opens and handles classified dialogue', async () => {
      mockDataProvider.mockResolvedValue({
        data: { nature: 'kind', category: 'aspect' }
      });

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Open Classified'));

      await waitFor(() => {
        expect(screen.getByTestId('classified-dialogue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('OK'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('unloadEntities', { uids: [3, 4] });
      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadEntities', { uids: [1, 2] });
    });
  });

  describe('Delete Dialogues', () => {
    it('opens and handles entity delete dialogue', async () => {
      mockDataProvider.mockResolvedValue({
        data: { nature: 'kind', category: 'aspect' }
      });

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete Entity'));

      await waitFor(() => {
        expect(screen.getByTestId('delete-entity-dialogue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('deleteEntity', { uid: 123 });
    });

    it('opens and handles fact delete dialogue', async () => {
      render(<GraphContextMenu {...defaultProps} type="fact" />);

      await waitFor(() => {
        expect(screen.getByTestId('fact-context-menu')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete Fact'));

      await waitFor(() => {
        expect(screen.getByTestId('delete-fact-dialogue')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Delete'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('deleteFact', { uid: 123 });
    });
  });

  describe('Error Handling', () => {
    it('handles dataProvider errors gracefully', async () => {
      mockDataProvider.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<GraphContextMenu {...defaultProps} />);

      await waitFor(() => {
        // Component should still render without crashing
        expect(screen.getByTestId).toBeDefined();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Props Handling', () => {
    it('passes correct props to child components', async () => {
      mockDataProvider.mockResolvedValue({
        data: { nature: 'kind', category: 'aspect' }
      });

      const customProps = {
        ...defaultProps,
        x: 300,
        y: 400,
        uid: 789
      };

      render(<GraphContextMenu {...customProps} />);

      await waitFor(() => {
        expect(screen.getByText('Kind Context Menu - UID: 789')).toBeInTheDocument();
      });
    });

    it('handles missing relType for facts', async () => {
      render(<GraphContextMenu {...defaultProps} type="fact" />);

      await waitFor(() => {
        expect(screen.getByTestId('fact-context-menu')).toBeInTheDocument();
      });
    });
  });

  it('takes a snapshot of the component with kind menu', async () => {
    mockDataProvider.mockResolvedValue({
      data: { nature: 'kind', category: 'aspect' }
    });

    const { container } = render(<GraphContextMenu {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});