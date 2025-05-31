import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MyMenu } from '../MyMenu';

// Mock react-admin
jest.mock('react-admin', () => ({
  Menu: ({ children }: any) => (
    <div data-testid="react-admin-menu">
      {children}
    </div>
  )
}));

// Mock MUI icons
jest.mock('@mui/icons-material/Label', () => {
  return function MockLabelIcon() {
    return <div data-testid="label-icon">Label Icon</div>;
  };
});

jest.mock('@mui/icons-material/TravelExplore', () => {
  return function MockTravelExploreIcon() {
    return <div data-testid="travel-explore-icon">Travel Explore Icon</div>;
  };
});

jest.mock('@mui/icons-material/BlurCircular', () => {
  return function MockBlurCircularIcon() {
    return <div data-testid="blur-circular-icon">Blur Circular Icon</div>;
  };
});

jest.mock('@mui/icons-material/Plumbing', () => {
  return function MockPlumbingIcon() {
    return <div data-testid="plumbing-icon">Plumbing Icon</div>;
  };
});

jest.mock('@mui/icons-material/Foundation', () => {
  return function MockFoundationIcon() {
    return <div data-testid="foundation-icon">Foundation Icon</div>;
  };
});

// Apply the enhanced mock
jest.mock('react-admin', () => {
  const mockMenu = ({ children }: any) => (
    <div data-testid="react-admin-menu">
      {children}
    </div>
  );

  mockMenu.DashboardItem = () => (
    <div data-testid="dashboard-item">Dashboard</div>
  );

  mockMenu.ResourceItem = ({ name }: any) => (
    <div data-testid={`resource-item-${name}`}>Resource: {name}</div>
  );

  mockMenu.Item = ({ to, primaryText, leftIcon }: any) => (
    <div data-testid={`menu-item-${to}`}>
      {leftIcon && <span data-testid="menu-icon">{leftIcon}</span>}
      <span data-testid="menu-text">{primaryText}</span>
    </div>
  );

  return {
    Menu: mockMenu
  };
});

describe('MyMenu', () => {
  it('renders the react-admin Menu wrapper', () => {
    render(<MyMenu />);
    
    expect(screen.getByTestId('react-admin-menu')).toBeInTheDocument();
  });

  it('renders the Dashboard menu item', () => {
    render(<MyMenu />);
    
    expect(screen.getByTestId('dashboard-item')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders the db/kinds resource item', () => {
    render(<MyMenu />);
    
    expect(screen.getByTestId('resource-item-db/kinds')).toBeInTheDocument();
    expect(screen.getByText('Resource: db/kinds')).toBeInTheDocument();
  });

  it('renders the Graph menu item with correct props', () => {
    render(<MyMenu />);
    
    expect(screen.getByTestId('menu-item-env/graph')).toBeInTheDocument();
    expect(screen.getByTestId('menu-text')).toHaveTextContent('Graph');
    expect(screen.getByTestId('menu-icon')).toBeInTheDocument();
    expect(screen.getByTestId('blur-circular-icon')).toBeInTheDocument();
  });

  it('includes the BlurCircular icon for the Graph item', () => {
    render(<MyMenu />);
    
    // The icon should be rendered within the Graph menu item
    const graphItem = screen.getByTestId('menu-item-env/graph');
    expect(graphItem).toBeInTheDocument();
    
    // Check that the icon is present
    expect(screen.getByTestId('blur-circular-icon')).toBeInTheDocument();
  });

  it('has the correct menu structure', () => {
    render(<MyMenu />);
    
    // Verify all expected menu items are present
    expect(screen.getByTestId('dashboard-item')).toBeInTheDocument();
    expect(screen.getByTestId('resource-item-db/kinds')).toBeInTheDocument();
    expect(screen.getByTestId('menu-item-env/graph')).toBeInTheDocument();
    
    // Verify the Graph item has the correct text
    expect(screen.getByText('Graph')).toBeInTheDocument();
  });

  it('does not render commented out menu items', () => {
    render(<MyMenu />);
    
    // These items are commented out in the source, so they shouldn't appear
    expect(screen.queryByText('Modelling')).not.toBeInTheDocument();
    expect(screen.queryByText('Workflows')).not.toBeInTheDocument();
    expect(screen.queryByTestId('plumbing-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('foundation-icon')).not.toBeInTheDocument();
  });

  it('renders without crashing', () => {
    expect(() => render(<MyMenu />)).not.toThrow();
  });

  it('contains all required menu components', () => {
    const { container } = render(<MyMenu />);
    
    // Should contain the main menu wrapper
    expect(container.querySelector('[data-testid="react-admin-menu"]')).toBeInTheDocument();
    
    // Should contain all active menu items
    expect(container.querySelector('[data-testid="dashboard-item"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="resource-item-db/kinds"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="menu-item-env/graph"]')).toBeInTheDocument();
  });

  it('has proper menu item hierarchy', () => {
    render(<MyMenu />);
    
    const menu = screen.getByTestId('react-admin-menu');
    
    // All menu items should be children of the main menu
    expect(menu).toContainElement(screen.getByTestId('dashboard-item'));
    expect(menu).toContainElement(screen.getByTestId('resource-item-db/kinds'));
    expect(menu).toContainElement(screen.getByTestId('menu-item-env/graph'));
  });

  it('uses correct navigation paths', () => {
    render(<MyMenu />);
    
    // Graph item should have the correct 'to' prop
    expect(screen.getByTestId('menu-item-env/graph')).toBeInTheDocument();
    
    // Resource item should reference the correct resource
    expect(screen.getByTestId('resource-item-db/kinds')).toBeInTheDocument();
  });

  it('takes a snapshot', () => {
    const { container } = render(<MyMenu />);
    expect(container).toMatchSnapshot();
  });
});