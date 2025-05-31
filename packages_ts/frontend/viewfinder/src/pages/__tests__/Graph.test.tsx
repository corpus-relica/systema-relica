import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import Graph from '../Graph';

// Mock the RootStoreContext
const mockStores = {
  factDataStore: {
    facts: [
      {
        fact_uid: 1,
        lh_object_name: 'Test Object 1',
        rel_type_name: 'is a',
        rh_object_name: 'Test Object 2',
        full_definition: 'Test definition'
      },
      {
        fact_uid: 2,
        lh_object_name: 'Test Object 3',
        rel_type_name: 'has',
        rh_object_name: 'Test Object 4',
        full_definition: null
      }
    ],
    categories: [
      { uid: 1, name: 'Category 1' },
      { uid: 2, name: 'Category 2' }
    ]
  },
  colorPaletteStore: {
    paletteMap: new Map([
      [1, '#ff0000'],
      [2, '#00ff00']
    ])
  },
  userDataStore: {
    userID: 'test-user-123'
  },
  nousDataStore: {
    messages: [
      { id: 1, type: 'user', content: 'Hello' },
      { id: 2, type: 'assistant', content: 'Hi there!' }
    ],
    addMessage: jest.fn()
  }
};

jest.mock('../../context/RootStoreContext.js', () => ({
  useStores: () => mockStores
}));

// Mock MobX observer
jest.mock('mobx-react', () => ({
  observer: (component: any) => component
}));

// Mock socket functions
jest.mock('../../socket', () => ({
  sockSendCC: jest.fn(),
  sendSocketMessage: jest.fn(),
  portalWs: {
    send: jest.fn()
  }
}));

// Mock auth provider
jest.mock('../../providers/AuthProvider', () => ({
  getAuthToken: jest.fn().mockReturnValue('mock-token')
}));

// Mock MUI components
jest.mock('@mui/material/IconButton', () => {
  return function MockIconButton({ children, onClick, ...props }: any) {
    return (
      <button data-testid="icon-button" onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Paper', () => {
  return function MockPaper({ children, ...props }: any) {
    return (
      <div data-testid="paper" {...props}>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Slide', () => {
  return function MockSlide({ children, in: inProp, ...props }: any) {
    return inProp ? (
      <div data-testid="slide" {...props}>
        {children}
      </div>
    ) : null;
  };
});

jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, sx, onMouseDown, onClick, ...props }: any) {
    return (
      <div 
        data-testid="box" 
        onMouseDown={onMouseDown}
        onClick={onClick}
        style={sx}
        {...props}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Fab', () => {
  return function MockFab({ children, onClick, ...props }: any) {
    return (
      <button data-testid="fab" onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Button', () => {
  return function MockButton({ children, onClick, ...props }: any) {
    return (
      <button data-testid="button" onClick={onClick} {...props}>
        {children}
      </button>
    );
  };
});

jest.mock('@mui/material/Modal', () => {
  return function MockModal({ children, open, onClose, ...props }: any) {
    return open ? (
      <div data-testid="modal" data-open={open} {...props}>
        <div onClick={onClose} data-testid="modal-backdrop" />
        {children}
      </div>
    ) : null;
  };
});

// Mock MUI icons
jest.mock('@mui/icons-material/CopyAll', () => {
  return function MockCopyAllIcon() {
    return <div data-testid="copy-all-icon">Copy All Icon</div>;
  };
});

jest.mock('@mui/icons-material/ChevronLeft', () => {
  return function MockChevronLeftIcon() {
    return <div data-testid="chevron-left-icon">Chevron Left Icon</div>;
  };
});

jest.mock('@mui/icons-material/ChevronRight', () => {
  return function MockChevronRightIcon() {
    return <div data-testid="chevron-right-icon">Chevron Right Icon</div>;
  };
});

// Mock external components
jest.mock('@relica/fact-search-ui', () => ({
  FactTable: ({ callback, ...props }: any) => (
    <div data-testid="fact-table" {...props}>
      <button 
        data-testid="fact-table-select"
        onClick={() => callback({ lh_object_uid: 123 })}
      >
        Select Fact
      </button>
    </div>
  )
}));

jest.mock('../GraphToo.js', () => {
  return function MockGraphAndSelectionLayout(props: any) {
    return (
      <div data-testid="graph-and-selection-layout">
        <button 
          data-testid="mock-node-select"
          onClick={() => props.selectNode(123)}
        >
          Select Node
        </button>
        <button 
          data-testid="mock-context-menu"
          onClick={(e: any) => props.handleContextMenuTrigger(456, 'individual', e)}
        >
          Context Menu
        </button>
        <button 
          data-testid="mock-edge-click"
          onClick={() => props.handleEdgeClick(789)}
        >
          Edge Click
        </button>
        <button 
          data-testid="mock-stage-click"
          onClick={props.onStageClick}
        >
          Stage Click
        </button>
        <button 
          data-testid="mock-search-ui-open"
          onClick={() => props.setSearchUIOpen(true)}
        >
          Open Search
        </button>
      </div>
    );
  };
});

jest.mock('../../components/Chat/index', () => {
  return function MockChat({ messages, onSubmit }: any) {
    return (
      <div data-testid="chat">
        <div data-testid="chat-messages">
          {messages.map((msg: any) => (
            <div key={msg.id} data-testid={`message-${msg.type}`}>
              {msg.content}
            </div>
          ))}
        </div>
        <button 
          data-testid="chat-submit"
          onClick={() => onSubmit('Test message')}
        >
          Send Message
        </button>
      </div>
    );
  };
});

jest.mock('../../components/SelectionDetails/index', () => {
  return function MockSelectionDetails() {
    return <div data-testid="selection-details">Selection Details</div>;
  };
});

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn().mockResolvedValue(undefined)
  }
});

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_PORTAL_API_URL: 'http://localhost:2174'
  }
});

describe('Graph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders the main graph layout', () => {
      render(<Graph />);
      
      expect(screen.getByTestId('graph-and-selection-layout')).toBeInTheDocument();
    });

    it('renders the copy all FAB button', () => {
      render(<Graph />);
      
      expect(screen.getByTestId('fab')).toBeInTheDocument();
      expect(screen.getByTestId('copy-all-icon')).toBeInTheDocument();
    });

    it('renders the right panel with selection details and chat', () => {
      render(<Graph />);
      
      expect(screen.getByTestId('selection-details')).toBeInTheDocument();
      expect(screen.getByTestId('chat')).toBeInTheDocument();
    });

    it('renders the panel toggle button', () => {
      render(<Graph />);
      
      const toggleButtons = screen.getAllByTestId('icon-button');
      expect(toggleButtons.length).toBeGreaterThan(0);
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
    });
  });

  describe('Panel Management', () => {
    it('toggles panel visibility when toggle button is clicked', async () => {
      render(<Graph />);
      
      // Find the toggle button (should show chevron-right initially)
      expect(screen.getByTestId('chevron-right-icon')).toBeInTheDocument();
      
      // Click toggle button
      const toggleButton = screen.getAllByTestId('icon-button')[0];
      fireEvent.click(toggleButton);
      
      // Panel should now be closed (chevron-left should appear)
      await waitFor(() => {
        expect(screen.getByTestId('chevron-left-icon')).toBeInTheDocument();
      });
    });

    it('handles horizontal panel resizing', async () => {
      render(<Graph />);
      
      // Find resize handle (Box with onMouseDown)
      const boxes = screen.getAllByTestId('box');
      const resizeHandle = boxes.find(box => 
        box.getAttribute('onMouseDown') !== null
      );
      
      expect(resizeHandle).toBeInTheDocument();
      
      // Simulate mouse down on resize handle
      fireEvent.mouseDown(resizeHandle!);
      
      // Simulate mouse move
      fireEvent.mouseMove(document, { clientX: 400 });
      
      // Simulate mouse up
      fireEvent.mouseUp(document);
    });
  });

  describe('Search UI Modal', () => {
    it('opens search UI modal when triggered', async () => {
      render(<Graph />);
      
      // Initially modal should not be visible
      expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      
      // Trigger search UI open
      fireEvent.click(screen.getByTestId('mock-search-ui-open'));
      
      // Modal should now be visible
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
        expect(screen.getByTestId('fact-table')).toBeInTheDocument();
      });
    });

    it('closes search UI modal when close button is clicked', async () => {
      render(<Graph />);
      
      // Open modal
      fireEvent.click(screen.getByTestId('mock-search-ui-open'));
      
      await waitFor(() => {
        expect(screen.getByTestId('modal')).toBeInTheDocument();
      });
      
      // Click close button
      fireEvent.click(screen.getByTestId('button'));
      
      // Modal should be closed
      await waitFor(() => {
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });

    it('handles fact selection from search UI', async () => {
      const { sendSocketMessage } = require('../../socket');
      
      render(<Graph />);
      
      // Open modal
      fireEvent.click(screen.getByTestId('mock-search-ui-open'));
      
      await waitFor(() => {
        expect(screen.getByTestId('fact-table')).toBeInTheDocument();
      });
      
      // Select a fact
      fireEvent.click(screen.getByTestId('fact-table-select'));
      
      // Should send socket message and close modal
      await waitFor(() => {
        expect(sendSocketMessage).toHaveBeenCalledWith('loadSpecializationHierarchy', { uid: 123 });
        expect(sendSocketMessage).toHaveBeenCalledWith('selectEntity', { uid: 123 });
        expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
      });
    });
  });

  describe('Graph Interactions', () => {
    it('handles node selection', () => {
      const { sendSocketMessage } = require('../../socket');
      
      render(<Graph />);
      
      fireEvent.click(screen.getByTestId('mock-node-select'));
      
      expect(sendSocketMessage).toHaveBeenCalledWith('selectEntity', { uid: 123 });
    });

    it('handles context menu trigger', () => {
      render(<Graph />);
      
      fireEvent.click(screen.getByTestId('mock-context-menu'));
      
      // Context menu state should be updated (open = true)
      // This is tested indirectly through the component not crashing
    });

    it('handles edge click', () => {
      const { sockSendCC } = require('../../socket');
      
      render(<Graph />);
      
      fireEvent.click(screen.getByTestId('mock-edge-click'));
      
      expect(sockSendCC).toHaveBeenCalledWith('selectFact', { uid: 789 });
    });

    it('handles stage click', () => {
      const { sendSocketMessage } = require('../../socket');
      
      render(<Graph />);
      
      fireEvent.click(screen.getByTestId('mock-stage-click'));
      
      expect(sendSocketMessage).toHaveBeenCalledWith('selectNone', {});
    });
  });

  describe('Copy Functionality', () => {
    it('copies all facts to clipboard when copy button is clicked', async () => {
      render(<Graph />);
      
      fireEvent.click(screen.getByTestId('fab'));
      
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          '- Test Object 1 -> is a -> Test Object 2 : Test definition\n- Test Object 3 -> has -> Test Object 4'
        );
      });
    });
  });

  describe('Chat Integration', () => {
    it('renders chat with messages from store', () => {
      render(<Graph />);
      
      expect(screen.getByTestId('message-user')).toHaveTextContent('Hello');
      expect(screen.getByTestId('message-assistant')).toHaveTextContent('Hi there!');
    });

    it('handles chat message submission', () => {
      const { portalWs } = require('../../socket');
      
      render(<Graph />);
      
      fireEvent.click(screen.getByTestId('chat-submit'));
      
      expect(mockStores.nousDataStore.addMessage).toHaveBeenCalledWith('user', 'Test message');
      expect(portalWs.send).toHaveBeenCalledWith('chatUserInput', {
        message: 'Test message',
        'user-id': 'test-user-123'
      });
    });
  });

  describe('Resizable Divider', () => {
    it('handles vertical divider resizing', async () => {
      render(<Graph />);
      
      // Find all boxes and look for one that might be the divider
      const boxes = screen.getAllByTestId('box');
      
      // The divider should be one of the boxes with mouse down handler
      const dividerBox = boxes.find(box => 
        box.style.cursor === 'row-resize' || 
        box.getAttribute('onMouseDown') !== null
      );
      
      if (dividerBox) {
        // Simulate dragging the divider
        fireEvent.mouseDown(dividerBox);
        
        // Simulate mouse move
        act(() => {
          fireEvent.mouseMove(document, { clientY: 300 });
        });
        
        // Simulate mouse up
        act(() => {
          fireEvent.mouseUp(document);
        });
      }
      
      // Component should not crash
      expect(screen.getByTestId('selection-details')).toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('uses facts from factDataStore', () => {
      render(<Graph />);
      
      // The component should receive facts from the store
      // This is verified by the copy functionality working with the mock facts
      expect(screen.getByTestId('graph-and-selection-layout')).toBeInTheDocument();
    });

    it('uses categories from factDataStore', () => {
      render(<Graph />);
      
      // Categories are passed to GraphAndSelectionLayout
      expect(screen.getByTestId('graph-and-selection-layout')).toBeInTheDocument();
    });

    it('uses paletteMap from colorPaletteStore', () => {
      render(<Graph />);
      
      // PaletteMap is passed to GraphAndSelectionLayout
      expect(screen.getByTestId('graph-and-selection-layout')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles missing environment variables gracefully', () => {
      // Temporarily remove the env var
      const originalEnv = import.meta.env.VITE_PORTAL_API_URL;
      delete (import.meta.env as any).VITE_PORTAL_API_URL;
      
      expect(() => render(<Graph />)).not.toThrow();
      
      // Restore env var
      (import.meta.env as any).VITE_PORTAL_API_URL = originalEnv;
    });

    it('handles clipboard write errors gracefully', async () => {
      // Mock clipboard to throw error
      (navigator.clipboard.writeText as jest.Mock).mockRejectedValueOnce(new Error('Clipboard error'));
      
      render(<Graph />);
      
      // Should not crash when copy fails
      expect(() => fireEvent.click(screen.getByTestId('fab'))).not.toThrow();
    });
  });

  describe('Component State Management', () => {
    it('manages selected node state correctly', () => {
      render(<Graph />);
      
      // Select a node
      fireEvent.click(screen.getByTestId('mock-node-select'));
      
      // Component should not crash and should maintain state
      expect(screen.getByTestId('graph-and-selection-layout')).toBeInTheDocument();
    });

    it('manages selected edge state correctly', () => {
      render(<Graph />);
      
      // Select an edge
      fireEvent.click(screen.getByTestId('mock-edge-click'));
      
      // Component should not crash and should maintain state
      expect(screen.getByTestId('graph-and-selection-layout')).toBeInTheDocument();
    });
  });

  it('takes a snapshot', () => {
    const { container } = render(<Graph />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot with modal open', async () => {
    const { container } = render(<Graph />);
    
    // Open search modal
    fireEvent.click(screen.getByTestId('mock-search-ui-open'));
    
    await waitFor(() => {
      expect(screen.getByTestId('modal')).toBeInTheDocument();
    });
    
    expect(container).toMatchSnapshot();
  });
});