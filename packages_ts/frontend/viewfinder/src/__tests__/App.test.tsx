import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { App } from '../App';
import { MockWebSocket } from '../tests/setup/websocketMock';
import { setupMockWebSocket, cleanupMockWebSocket } from '../tests/helpers/cacheTestHelpers';

// Mock react-admin
jest.mock('react-admin', () => ({
  Admin: ({ children, ...props }: any) => (
    <div data-testid="admin" {...props}>
      {children}
    </div>
  ),
  Resource: ({ name, ...props }: any) => (
    <div data-testid={`resource-${name}`} {...props} />
  ),
  ListGuesser: () => <div data-testid="list-guesser">List Guesser</div>,
  EditGuesser: () => <div data-testid="edit-guesser">Edit Guesser</div>,
  ShowGuesser: () => <div data-testid="show-guesser">Show Guesser</div>,
  CustomRoutes: ({ children }: any) => (
    <div data-testid="custom-routes">{children}</div>
  ),
  combineDataProviders: jest.fn(),
  defaultDataProvider: {},
  localStorageStore: jest.fn(() => ({})),
  useStore: jest.fn(),
  useStoreContext: jest.fn()
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  Route: ({ path, element, ...props }: any) => (
    <div data-testid={`route-${path}`} {...props}>
      {element}
    </div>
  ),
  BrowserRouter: ({ children }: any) => (
    <div data-testid="browser-router">{children}</div>
  ),
  Routes: ({ children }: any) => (
    <div data-testid="routes">{children}</div>
  )
}));

// Mock @tanstack/react-query
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn(() => ({})),
  QueryClientProvider: ({ children }: any) => (
    <div data-testid="query-client-provider">{children}</div>
  )
}));

// Mock providers
jest.mock('../providers/AuthProvider.js', () => ({
  authProvider: {}
}));

jest.mock('../providers/EnvDataProvider.js', () => ({
  __esModule: true,
  default: {
    getList: jest.fn(),
    getOne: jest.fn()
  }
}));

jest.mock('../providers/FactsDatProvider.js', () => ({
  __esModule: true,
  default: {}
}));

jest.mock('../providers/ArchivistDataProvider.js', () => ({
  __esModule: true,
  default: {}
}));

// Mock context
jest.mock('../context/RootStoreContext.js', () => ({
  useStores: jest.fn()
}));

// Mock IO clients
jest.mock('../io/ArchivistBaseClient.js', () => ({
  resolveUIDs: jest.fn()
}));

jest.mock('../io/CCBaseClient.js', () => ({
  retrieveEnvironment: jest.fn()
}));

jest.mock('../io/PortalClient.js', () => ({
  portalClient: {
    getSetupStatus: jest.fn()
  }
}));

jest.mock('../socket.js', () => ({
  initializeWebSocket: jest.fn(),
  portalWs: {}
}));

// Mock layout and pages
jest.mock('../MyLayout.js', () => ({
  MyLayout: () => <div data-testid="my-layout">My Layout</div>
}));

jest.mock('../MyLoginPage.js', () => ({
  __esModule: true,
  default: () => <div data-testid="my-login-page">My Login Page</div>
}));

jest.mock('../pages/Graph.js', () => ({
  __esModule: true,
  default: () => <div data-testid="graph-page">Graph Page</div>
}));

jest.mock('../pages/Settings.js', () => ({
  __esModule: true,
  default: () => <div data-testid="settings-page">Settings Page</div>
}));

jest.mock('../pages/Modelling/index.js', () => ({
  __esModule: true,
  default: () => <div data-testid="modelling-page">Modelling Page</div>
}));

jest.mock('../pages/Workflows/index.js', () => ({
  __esModule: true,
  default: () => <div data-testid="workflows-page">Workflows Page</div>
}));

jest.mock('../Dashboard.js', () => ({
  __esModule: true,
  default: () => <div data-testid="dashboard">Dashboard</div>
}));

jest.mock('../pages/Setup', () => ({
  __esModule: true,
  default: ({ initialState }: any) => (
    <div data-testid="setup-wizard">
      Setup Wizard {initialState ? `- State: ${initialState.state?.id}` : ''}
    </div>
  )
}));

describe('App', () => {
  let mockWs: MockWebSocket;
  let mockUseStores: jest.Mock;
  let mockPortalClient: any;
  let mockInitializeWebSocket: jest.Mock;

  beforeEach(() => {
    mockWs = setupMockWebSocket();
    
    mockUseStores = jest.fn().mockReturnValue({
      factDataStore: {
        setCategories: jest.fn()
      }
    });

    mockPortalClient = {
      getSetupStatus: jest.fn()
    };

    mockInitializeWebSocket = jest.fn();

    const { useStores } = require('../context/RootStoreContext.js');
    useStores.mockImplementation(mockUseStores);

    const { portalClient } = require('../io/PortalClient.js');
    Object.assign(portalClient, mockPortalClient);

    const { initializeWebSocket } = require('../socket.js');
    initializeWebSocket.mockImplementation(mockInitializeWebSocket);

    // Mock fetch for guest auth
    global.fetch = jest.fn();

    // Mock environment variables
    Object.defineProperty(import.meta, 'env', {
      value: {
        VITE_SHUTTER_URL: 'http://localhost:2173'
      },
      writable: true
    });
  });

  afterEach(() => {
    cleanupMockWebSocket();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('Setup Complete State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-token' })
      });

      mockPortalClient.getSetupStatus.mockResolvedValue({
        state: { id: 'setup_complete' }
      });

      mockInitializeWebSocket.mockResolvedValue(undefined);
    });

    it('renders the main admin interface when setup is complete', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('query-client-provider')).toBeInTheDocument();
        expect(screen.getByTestId('admin')).toBeInTheDocument();
      });

      expect(screen.getByTestId('my-layout')).toBeInTheDocument();
      expect(screen.getByTestId('my-login-page')).toBeInTheDocument();
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('renders custom routes', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('custom-routes')).toBeInTheDocument();
      });

      expect(screen.getByTestId('route-env/graph')).toBeInTheDocument();
      expect(screen.getByTestId('route-/settings')).toBeInTheDocument();
      expect(screen.getByTestId('route-/setup')).toBeInTheDocument();
    });

    it('renders resources', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('resource-db/kinds')).toBeInTheDocument();
      });
    });

    it('initializes WebSocket with guest token', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockInitializeWebSocket).toHaveBeenCalledWith('guest-token');
      });
    });

    it('calls portalClient.getSetupStatus', async () => {
      render(<App />);

      await waitFor(() => {
        expect(mockPortalClient.getSetupStatus).toHaveBeenCalled();
      });
    });
  });

  describe('Setup Needed State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-token' })
      });

      mockPortalClient.getSetupStatus.mockResolvedValue({
        state: { id: 'setup_needed' }
      });

      mockInitializeWebSocket.mockResolvedValue(undefined);
    });

    it('renders setup wizard when setup is needed', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('browser-router')).toBeInTheDocument();
        expect(screen.getByTestId('routes')).toBeInTheDocument();
        expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
      });

      expect(screen.getByText('Setup Wizard - State: setup_needed')).toBeInTheDocument();
    });

    it('does not render admin interface when setup is needed', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('admin')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-token' })
      });

      // Make the setup status call hang to keep it in loading state
      mockPortalClient.getSetupStatus.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ state: { id: 'setup_complete' } }), 1000))
      );

      mockInitializeWebSocket.mockResolvedValue(undefined);
    });

    it('displays loading message while checking setup status', () => {
      render(<App />);

      expect(screen.getByText('Checking system status...')).toBeInTheDocument();
    });

    it('applies correct loading styles', () => {
      render(<App />);

      const loadingContainer = screen.getByText('Checking system status...').parentElement;
      expect(loadingContainer).toHaveStyle({
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      });
    });
  });

  describe('Error State', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-token' })
      });

      mockPortalClient.getSetupStatus.mockRejectedValue(new Error('Connection failed'));
      mockInitializeWebSocket.mockResolvedValue(undefined);
    });

    it('displays error message when setup status check fails', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('System Setup Error')).toBeInTheDocument();
      });

      expect(screen.getByText(/We couldn't connect to the necessary system components/)).toBeInTheDocument();
    });

    it('displays error reasons', async () => {
      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('The backend services are not running')).toBeInTheDocument();
        expect(screen.getByText('There\'s a network connectivity issue')).toBeInTheDocument();
        expect(screen.getByText('The system configuration is incorrect')).toBeInTheDocument();
      });
    });

    it('provides refresh button', async () => {
      const reloadSpy = jest.fn();
      Object.defineProperty(window, 'location', {
        value: { reload: reloadSpy },
        writable: true
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Refresh Page'));
      expect(reloadSpy).toHaveBeenCalled();
    });

    it('applies correct error styles', async () => {
      render(<App />);

      await waitFor(() => {
        const errorContainer = screen.getByText('System Setup Error').closest('div');
        expect(errorContainer).toHaveStyle({
          maxWidth: '500px',
          padding: '30px',
          borderRadius: '8px',
          backgroundColor: 'white'
        });
      });
    });
  });

  describe('Guest Authentication', () => {
    it('handles guest auth failure gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Auth failed'));

      mockPortalClient.getSetupStatus.mockResolvedValue({
        state: { id: 'setup_complete' }
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<App />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to get guest token, proceeding without WebSocket:',
          expect.any(Error)
        );
      });

      expect(mockInitializeWebSocket).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles non-OK guest auth response', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500
      });

      mockPortalClient.getSetupStatus.mockResolvedValue({
        state: { id: 'setup_complete' }
      });

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<App />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Guest auth response not OK:', 500);
      });

      expect(mockInitializeWebSocket).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles WebSocket initialization failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-token' })
      });

      mockPortalClient.getSetupStatus.mockResolvedValue({
        state: { id: 'setup_complete' }
      });

      mockInitializeWebSocket.mockRejectedValue(new Error('WebSocket failed'));

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      render(<App />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'WebSocket initialization failed (no token):',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Store Integration', () => {
    it('uses factDataStore correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-token' })
      });

      mockPortalClient.getSetupStatus.mockResolvedValue({
        state: { id: 'setup_complete' }
      });

      render(<App />);

      await waitFor(() => {
        expect(mockUseStores).toHaveBeenCalled();
      });
    });
  });

  describe('Environment Variables', () => {
    it('uses default SHUTTER_URL when not provided', async () => {
      Object.defineProperty(import.meta, 'env', {
        value: {},
        writable: true
      });

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'guest-token' })
      });

      mockPortalClient.getSetupStatus.mockResolvedValue({
        state: { id: 'setup_complete' }
      });

      render(<App />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://localhost:2173/api/guest-auth',
          expect.any(Object)
        );
      });
    });
  });

  it('takes a snapshot of loading state', () => {
    mockPortalClient.getSetupStatus.mockImplementation(() => new Promise(() => {}));

    const { container } = render(<App />);
    expect(container).toMatchSnapshot();
  });

  it('takes a snapshot of setup needed state', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'guest-token' })
    });

    mockPortalClient.getSetupStatus.mockResolvedValue({
      state: { id: 'setup_needed' }
    });

    const { container } = render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('setup-wizard')).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});