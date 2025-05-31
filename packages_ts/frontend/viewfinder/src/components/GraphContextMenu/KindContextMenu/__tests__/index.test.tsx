import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import KindContextMenu from '../index';
import { MockWebSocket } from '../../../../tests/setup/websocketMock';
import { setupMockWebSocket, cleanupMockWebSocket } from '../../../../tests/helpers/cacheTestHelpers';

// Mock the socket module
jest.mock('../../../../socket', () => ({
  sendSocketMessage: jest.fn()
}));

// Mock the PortalClient
jest.mock('../../../../io/PortalClient.js', () => ({
  portalClient: {
    getClassified: jest.fn(),
    getSubtypes: jest.fn()
  }
}));

// Mock the RootStoreContext
jest.mock('../../../../context/RootStoreContext', () => ({
  useStores: jest.fn()
}));

// Mock MUI components
jest.mock('@mui/material/Menu', () => {
  return function MockMenu({ children, open, onClose, anchorPosition, ...props }: any) {
    if (!open) return null;
    return (
      <div data-testid="kind-context-menu" {...props}>
        <div data-testid="menu-position">{`${anchorPosition.top},${anchorPosition.left}`}</div>
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/MenuItem', () => {
  return function MockMenuItem({ children, onClick, value, disabled, ...props }: any) {
    return (
      <div
        data-testid={`menu-item-${value}`}
        onClick={disabled ? undefined : onClick}
        data-disabled={disabled}
        data-value={value}
        {...props}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Divider', () => {
  return function MockDivider() {
    return <div data-testid="menu-divider" />;
  };
});

// Mock submenu components
jest.mock('../submenu/PhsysicalObject', () => {
  return function MockPhysicalObjectSubmenu() {
    return <div data-testid="physical-object-submenu">Physical Object Submenu</div>;
  };
});

jest.mock('../submenu/Aspect', () => {
  return function MockAspectSubmenu() {
    return <div data-testid="aspect-submenu">Aspect Submenu</div>;
  };
});

jest.mock('../submenu/Role', () => {
  return function MockRoleSubmenu() {
    return <div data-testid="role-submenu">Role Submenu</div>;
  };
});

jest.mock('../submenu/Relation', () => {
  return function MockRelationSubmenu() {
    return <div data-testid="relation-submenu">Relation Submenu</div>;
  };
});

jest.mock('../submenu/Occurrence', () => {
  return function MockOccurrenceSubmenu() {
    return <div data-testid="occurrence-submenu">Occurrence Submenu</div>;
  };
});

describe('KindContextMenu', () => {
  let mockWs: MockWebSocket;
  let mockSendSocketMessage: jest.Mock;
  let mockPortalClient: any;
  let mockFactDataStore: any;
  let mockUseStores: jest.Mock;

  const defaultProps = {
    uid: 123,
    category: 'aspect',
    open: true,
    handleClose: jest.fn(),
    x: 100,
    y: 200,
    setSubtypesDialogueIsOpen: jest.fn(),
    setPossibleSubtypes: jest.fn(),
    setExistingSubtypes: jest.fn(),
    setClassifiedDialogueIsOpen: jest.fn(),
    setPossibleClassified: jest.fn(),
    setExistingClassified: jest.fn(),
    setUidToDelete: jest.fn(),
    setWarnIsOpen: jest.fn()
  };

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    mockSendSocketMessage = jest.fn();
    
    mockFactDataStore = {
      findDefinitiveFacts: jest.fn().mockReturnValue([])
    };
    
    mockUseStores = jest.fn().mockReturnValue({
      factDataStore: mockFactDataStore
    });

    mockPortalClient = {
      getClassified: jest.fn(),
      getSubtypes: jest.fn()
    };

    const { sendSocketMessage } = require('../../../../socket');
    sendSocketMessage.mockImplementation(mockSendSocketMessage);

    const { portalClient } = require('../../../../io/PortalClient.js');
    Object.assign(portalClient, mockPortalClient);

    const { useStores } = require('../../../../context/RootStoreContext');
    useStores.mockImplementation(mockUseStores);
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the kind context menu when open', () => {
      render(<KindContextMenu {...defaultProps} />);

      expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
      expect(screen.getByTestId('menu-position')).toHaveTextContent('200,100');
    });

    it('does not render when closed', () => {
      render(<KindContextMenu {...defaultProps} open={false} />);

      expect(screen.queryByTestId('kind-context-menu')).not.toBeInTheDocument();
    });

    it('renders all main menu items', () => {
      render(<KindContextMenu {...defaultProps} />);

      expect(screen.getByTestId('menu-item-load SH')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-load classified')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-load all related')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-load subtypes')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-load subtypes cone')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-add parent')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-reparent')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-unload this')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-unload subtypes cone')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-delete this!')).toBeInTheDocument();
    });

    it('shows correct menu item text', () => {
      render(<KindContextMenu {...defaultProps} />);

      expect(screen.getByText('SH')).toBeInTheDocument();
      expect(screen.getByText('load classified')).toBeInTheDocument();
      expect(screen.getByText('load all related')).toBeInTheDocument();
      expect(screen.getByText('load subtypes')).toBeInTheDocument();
      expect(screen.getByText('load subtypes cone')).toBeInTheDocument();
      expect(screen.getByText('add parent')).toBeInTheDocument();
      expect(screen.getByText('reparent')).toBeInTheDocument();
      expect(screen.getByText('unload this')).toBeInTheDocument();
      expect(screen.getByText('unload subtypes cone')).toBeInTheDocument();
      expect(screen.getByText('delete this!')).toBeInTheDocument();
    });

    it('disables appropriate menu items', () => {
      render(<KindContextMenu {...defaultProps} />);

      expect(screen.getByTestId('menu-item-add parent')).toHaveAttribute('data-disabled', 'true');
      expect(screen.getByTestId('menu-item-reparent')).toHaveAttribute('data-disabled', 'true');
    });

    it('renders dividers', () => {
      render(<KindContextMenu {...defaultProps} />);

      const dividers = screen.getAllByTestId('menu-divider');
      expect(dividers.length).toBeGreaterThan(0);
    });
  });

  describe('Category-specific Submenus', () => {
    it('renders aspect submenu for aspect category', () => {
      render(<KindContextMenu {...defaultProps} category="aspect" />);

      expect(screen.getByTestId('aspect-submenu')).toBeInTheDocument();
      expect(screen.getByText('Aspect Submenu')).toBeInTheDocument();
    });

    it('renders physical object submenu for physical object category', () => {
      render(<KindContextMenu {...defaultProps} category="physical object" />);

      expect(screen.getByTestId('physical-object-submenu')).toBeInTheDocument();
      expect(screen.getByText('Physical Object Submenu')).toBeInTheDocument();
    });

    it('renders role submenu for role category', () => {
      render(<KindContextMenu {...defaultProps} category="role" />);

      expect(screen.getByTestId('role-submenu')).toBeInTheDocument();
      expect(screen.getByText('Role Submenu')).toBeInTheDocument();
    });

    it('renders relation submenu for relation category', () => {
      render(<KindContextMenu {...defaultProps} category="relation" />);

      expect(screen.getByTestId('relation-submenu')).toBeInTheDocument();
      expect(screen.getByText('Relation Submenu')).toBeInTheDocument();
    });

    it('renders occurrence submenu for occurrence category', () => {
      render(<KindContextMenu {...defaultProps} category="occurrence" />);

      expect(screen.getByTestId('occurrence-submenu')).toBeInTheDocument();
      expect(screen.getByText('Occurrence Submenu')).toBeInTheDocument();
    });

    it('renders no submenu for unknown category', () => {
      render(<KindContextMenu {...defaultProps} category="unknown" />);

      expect(screen.queryByTestId('aspect-submenu')).not.toBeInTheDocument();
      expect(screen.queryByTestId('physical-object-submenu')).not.toBeInTheDocument();
      expect(screen.queryByTestId('role-submenu')).not.toBeInTheDocument();
      expect(screen.queryByTestId('relation-submenu')).not.toBeInTheDocument();
      expect(screen.queryByTestId('occurrence-submenu')).not.toBeInTheDocument();
    });
  });

  describe('Menu Item Interactions', () => {
    it('handles load SH action', () => {
      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-load SH'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadSpecializationHierarchy', { uid: 123 });
      expect(defaultProps.handleClose).toHaveBeenCalled();
    });

    it('handles load all related action', () => {
      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-load all related'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadAllRelatedFacts', { uid: 123 });
      expect(defaultProps.handleClose).toHaveBeenCalled();
    });

    it('handles load subtypes cone action', () => {
      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-load subtypes cone'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadSubtypesCone', { uid: 123 });
      expect(defaultProps.handleClose).toHaveBeenCalled();
    });

    it('handles unload this action', () => {
      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-unload this'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('unloadEntity', { uid: 123 });
      expect(defaultProps.handleClose).toHaveBeenCalled();
    });

    it('handles unload subtypes cone action', () => {
      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-unload subtypes cone'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('unloadSubtypesCone', { uid: 123 });
      expect(defaultProps.handleClose).toHaveBeenCalled();
    });

    it('handles delete this action', () => {
      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-delete this!'));

      expect(defaultProps.setUidToDelete).toHaveBeenCalledWith(123);
      expect(defaultProps.setWarnIsOpen).toHaveBeenCalledWith(true);
      expect(defaultProps.handleClose).toHaveBeenCalled();
    });
  });

  describe('Async Menu Actions', () => {
    it('handles load classified action', async () => {
      const mockClassified = [
        { lh_object_uid: 1 },
        { lh_object_uid: 2 },
        { lh_object_uid: 3 }
      ];
      
      mockPortalClient.getClassified.mockResolvedValue(mockClassified);
      mockFactDataStore.findDefinitiveFacts.mockImplementation((uid: number) => {
        return uid === 1 ? [{}] : []; // Only uid 1 has existing facts
      });

      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-load classified'));

      await waitFor(() => {
        expect(mockPortalClient.getClassified).toHaveBeenCalledWith(123);
        expect(defaultProps.setPossibleClassified).toHaveBeenCalledWith(mockClassified);
        expect(defaultProps.setExistingClassified).toHaveBeenCalledWith([1]);
        expect(defaultProps.setClassifiedDialogueIsOpen).toHaveBeenCalledWith(true);
        expect(defaultProps.handleClose).toHaveBeenCalled();
      });
    });

    it('handles load subtypes action', async () => {
      const mockSubtypes = [
        { lh_object_uid: 4 },
        { lh_object_uid: 5 },
        { lh_object_uid: 6 }
      ];
      
      mockPortalClient.getSubtypes.mockResolvedValue(mockSubtypes);
      mockFactDataStore.findDefinitiveFacts.mockImplementation((uid: number) => {
        return uid === 4 ? [{}] : []; // Only uid 4 has existing facts
      });

      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-load subtypes'));

      await waitFor(() => {
        expect(mockPortalClient.getSubtypes).toHaveBeenCalledWith(123);
        expect(defaultProps.setPossibleSubtypes).toHaveBeenCalledWith(mockSubtypes);
        expect(defaultProps.setExistingSubtypes).toHaveBeenCalledWith([4]);
        expect(defaultProps.setSubtypesDialogueIsOpen).toHaveBeenCalledWith(true);
        expect(defaultProps.handleClose).toHaveBeenCalled();
      });
    });

    it('handles API errors gracefully', async () => {
      mockPortalClient.getClassified.mockRejectedValue(new Error('API Error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-load classified'));

      await waitFor(() => {
        // Component should not crash
        expect(screen.getByTestId('kind-context-menu')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Disabled Actions', () => {
    it('handles add parent action (disabled)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<KindContextMenu {...defaultProps} />);

      // Try to click disabled item - should not trigger
      const addParentItem = screen.getByTestId('menu-item-add parent');
      fireEvent.click(addParentItem);

      // Should not call socket messages since it's disabled
      expect(mockSendSocketMessage).not.toHaveBeenCalled();
      expect(defaultProps.handleClose).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles reparent action (disabled)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<KindContextMenu {...defaultProps} />);

      // Try to click disabled item - should not trigger
      const reparentItem = screen.getByTestId('menu-item-reparent');
      fireEvent.click(reparentItem);

      // Should not call socket messages since it's disabled
      expect(mockSendSocketMessage).not.toHaveBeenCalled();
      expect(defaultProps.handleClose).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Props Handling', () => {
    it('handles different uid values', () => {
      render(<KindContextMenu {...defaultProps} uid={999} />);

      fireEvent.click(screen.getByTestId('menu-item-load SH'));

      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadSpecializationHierarchy', { uid: 999 });
    });

    it('handles different position coordinates', () => {
      render(<KindContextMenu {...defaultProps} x={300} y={400} />);

      expect(screen.getByTestId('menu-position')).toHaveTextContent('400,300');
    });
  });

  describe('Store Integration', () => {
    it('uses factDataStore correctly', async () => {
      const mockClassified = [{ lh_object_uid: 1 }];
      mockPortalClient.getClassified.mockResolvedValue(mockClassified);

      render(<KindContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-load classified'));

      await waitFor(() => {
        expect(mockFactDataStore.findDefinitiveFacts).toHaveBeenCalledWith(1);
      });
    });
  });

  it('takes a snapshot of the component with aspect category', () => {
    const { container } = render(<KindContextMenu {...defaultProps} category="aspect" />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot when closed', () => {
    const { container } = render(<KindContextMenu {...defaultProps} open={false} />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot with physical object category', () => {
    const { container } = render(<KindContextMenu {...defaultProps} category="physical object" />);
    expect(container).toMatchSnapshot();
  });
});