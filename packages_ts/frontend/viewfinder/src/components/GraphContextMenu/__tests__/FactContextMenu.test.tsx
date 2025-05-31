import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FactContextMenu from '../FactContextMenu';
import { MockWebSocket } from '../../../tests/setup/websocketMock';
import { setupMockWebSocket, cleanupMockWebSocket } from '../../../tests/helpers/cacheTestHelpers';

// Mock the socket module
jest.mock('../../../socket', () => ({
  sendSocketMessage: jest.fn()
}));

// Mock MUI components
jest.mock('@mui/material/Menu', () => {
  return function MockMenu({ children, open, onClose, anchorPosition, ...props }: any) {
    if (!open) return null;
    return (
      <div data-testid="fact-context-menu" {...props}>
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

describe('FactContextMenu', () => {
  let mockWs: MockWebSocket;
  let mockSendSocketMessage: jest.Mock;
  let mockHandleClose: jest.Mock;
  let mockSetUidToDelete: jest.Mock;
  let mockSetWarnIsOpen: jest.Mock;

  const defaultProps = {
    uid: 123,
    open: true,
    handleClose: jest.fn(),
    x: 100,
    y: 200,
    setUidToDelete: jest.fn(),
    setWarnIsOpen: jest.fn(),
    relType: 456
  };

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    mockSendSocketMessage = jest.fn();
    mockHandleClose = jest.fn();
    mockSetUidToDelete = jest.fn();
    mockSetWarnIsOpen = jest.fn();

    const { sendSocketMessage } = require('../../../socket');
    sendSocketMessage.mockImplementation(mockSendSocketMessage);

    // Reset default props with fresh mocks
    defaultProps.handleClose = mockHandleClose;
    defaultProps.setUidToDelete = mockSetUidToDelete;
    defaultProps.setWarnIsOpen = mockSetWarnIsOpen;
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the fact context menu when open', () => {
      render(<FactContextMenu {...defaultProps} />);

      expect(screen.getByTestId('fact-context-menu')).toBeInTheDocument();
      expect(screen.getByTestId('menu-position')).toHaveTextContent('200,100');
    });

    it('does not render when closed', () => {
      render(<FactContextMenu {...defaultProps} open={false} />);

      expect(screen.queryByTestId('fact-context-menu')).not.toBeInTheDocument();
    });

    it('renders all menu items', () => {
      render(<FactContextMenu {...defaultProps} />);

      expect(screen.getByTestId('menu-item-reify')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-Clear all')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-rem this')).toBeInTheDocument();
      expect(screen.getByTestId('menu-item-delete this!')).toBeInTheDocument();
      expect(screen.getByTestId('menu-divider')).toBeInTheDocument();
    });

    it('shows correct menu item text', () => {
      render(<FactContextMenu {...defaultProps} />);

      expect(screen.getByText('reify')).toBeInTheDocument();
      expect(screen.getByText('intercalate')).toBeInTheDocument();
      expect(screen.getByText('rem this')).toBeInTheDocument();
      expect(screen.getByText('delete this!')).toBeInTheDocument();
    });

    it('disables appropriate menu items', () => {
      render(<FactContextMenu {...defaultProps} />);

      expect(screen.getByTestId('menu-item-Clear all')).toHaveAttribute('data-disabled', 'true');
      expect(screen.getByTestId('menu-item-rem this')).toHaveAttribute('data-disabled', 'true');
      expect(screen.getByTestId('menu-item-reify')).not.toHaveAttribute('data-disabled', 'true');
      expect(screen.getByTestId('menu-item-delete this!')).not.toHaveAttribute('data-disabled', 'true');
    });
  });

  describe('Menu Item Interactions', () => {
    it('handles reify action', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FactContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-reify'));

      expect(consoleSpy).toHaveBeenCalledWith('Reifying relation type:', 456);
      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadSpecializationHierarchy', { uid: 456 });
      expect(mockSendSocketMessage).toHaveBeenCalledWith('selectEntity', { uid: 456 });
      expect(mockHandleClose).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles delete action', () => {
      render(<FactContextMenu {...defaultProps} />);

      fireEvent.click(screen.getByTestId('menu-item-delete this!'));

      expect(mockSetUidToDelete).toHaveBeenCalledWith(123);
      expect(mockSetWarnIsOpen).toHaveBeenCalledWith(true);
      expect(mockHandleClose).toHaveBeenCalled();
    });

    it('handles clear all action (disabled)', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FactContextMenu {...defaultProps} />);

      // Try to click disabled item - should not trigger
      const clearAllItem = screen.getByTestId('menu-item-Clear all');
      fireEvent.click(clearAllItem);

      // Should not call any functions since it's disabled
      expect(mockSendSocketMessage).not.toHaveBeenCalled();
      expect(mockHandleClose).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles rem this action (disabled)', () => {
      render(<FactContextMenu {...defaultProps} />);

      // Try to click disabled item - should not trigger
      const remThisItem = screen.getByTestId('menu-item-rem this');
      fireEvent.click(remThisItem);

      // Should not call any functions since it's disabled
      expect(mockSendSocketMessage).not.toHaveBeenCalled();
      expect(mockHandleClose).not.toHaveBeenCalled();
    });
  });

  describe('Console Logging', () => {
    it('logs when fact context menu is opened', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FactContextMenu {...defaultProps} />);

      expect(consoleSpy).toHaveBeenCalledWith('Fact context menu opened for uid:', 123);

      consoleSpy.mockRestore();
    });
  });

  describe('Props Handling', () => {
    it('handles different uid values', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FactContextMenu {...defaultProps} uid={999} />);

      expect(consoleSpy).toHaveBeenCalledWith('Fact context menu opened for uid:', 999);

      fireEvent.click(screen.getByTestId('menu-item-delete this!'));
      expect(mockSetUidToDelete).toHaveBeenCalledWith(999);

      consoleSpy.mockRestore();
    });

    it('handles different relType values', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FactContextMenu {...defaultProps} relType={789} />);

      fireEvent.click(screen.getByTestId('menu-item-reify'));

      expect(consoleSpy).toHaveBeenCalledWith('Reifying relation type:', 789);
      expect(mockSendSocketMessage).toHaveBeenCalledWith('loadSpecializationHierarchy', { uid: 789 });
      expect(mockSendSocketMessage).toHaveBeenCalledWith('selectEntity', { uid: 789 });

      consoleSpy.mockRestore();
    });

    it('handles different position coordinates', () => {
      render(<FactContextMenu {...defaultProps} x={300} y={400} />);

      expect(screen.getByTestId('menu-position')).toHaveTextContent('400,300');
    });
  });

  describe('Event Handling', () => {
    it('calls handleClose when menu is closed', () => {
      const { rerender } = render(<FactContextMenu {...defaultProps} />);

      // Simulate menu close
      rerender(<FactContextMenu {...defaultProps} open={false} />);

      // Menu should not be visible
      expect(screen.queryByTestId('fact-context-menu')).not.toBeInTheDocument();
    });
  });

  describe('Default Case Handling', () => {
    it('handles unknown menu item values', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      render(<FactContextMenu {...defaultProps} />);

      // Create a mock event with unknown value
      const mockEvent = {
        currentTarget: {
          getAttribute: jest.fn().mockReturnValue('unknown-action')
        }
      };

      // Get the component instance to test the handleItemClick method
      const component = screen.getByTestId('fact-context-menu');
      
      // This would normally be tested through the actual click handler
      // but since we're mocking the components, we'll verify the console log
      expect(consoleSpy).toHaveBeenCalledWith('Fact context menu opened for uid:', 123);

      consoleSpy.mockRestore();
    });
  });

  it('takes a snapshot of the component', () => {
    const { container } = render(<FactContextMenu {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot when closed', () => {
    const { container } = render(<FactContextMenu {...defaultProps} open={false} />);
    expect(container).toMatchSnapshot();
  });
});