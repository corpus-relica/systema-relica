/**
 * Testing preset for viewfinder package
 * Configures all necessary mocks and utilities for viewfinder application testing
 */

import { setupPackageTesting } from "../index";

/**
 * Setup testing environment specifically for viewfinder application
 * Includes all mocks: Three.js, Material-UI, WebSocket, Axios, and MobX
 */
export const setupViewfinderTesting = (): void => {
  setupPackageTesting("viewfinder");
};

// Re-export commonly used utilities for convenience
export {
  setupThreeMock,
  cleanupThreeMock,
  mockThree,
  setupMuiMock,
  cleanupMuiMock,
  mockMuiComponents,
  mockMuiIcons,
  mockTheme,
  setupGlobalWebSocketMock,
  cleanupGlobalWebSocketMock,
  MockWebSocket,
  setupAxiosMock,
  cleanupAxiosMock,
  createMockResponse,
  createMockError,
  configureMobxForTesting,
  setupMobxMock,
  cleanupMobxMock,
  MockStoreFactory,
  createMockStoreContext,
  testUtils,
  createMockEntity,
  createMockUser,
  createMockRelation,
  createMockFact,
  createTestScenario,
} from "../index";

// Viewfinder specific test utilities
export const viewfinderTestUtils = {
  /**
   * Create mock user session for testing
   */
  createMockUserSession: (overrides: any = {}) => ({
    user: {
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
      roles: ["user"],
    },
    token: "mock-jwt-token",
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
    isAuthenticated: true,
    ...overrides,
  }),

  /**
   * Create mock navigation state
   */
  createMockNavigationState: (overrides: any = {}) => ({
    currentPage: "dashboard",
    breadcrumbs: [
      { label: "Home", path: "/" },
      { label: "Dashboard", path: "/dashboard" },
    ],
    sidebarOpen: true,
    activeMenuItem: "dashboard",
    ...overrides,
  }),

  /**
   * Create mock dashboard data
   */
  createMockDashboardData: () => ({
    stats: {
      totalEntities: 1250,
      totalRelations: 3400,
      totalFacts: 8900,
      lastUpdated: new Date().toISOString(),
    },
    recentActivity: Array.from({ length: 5 }, (_, i) => ({
      id: `activity-${i}`,
      type: "entity_created",
      description: `Entity ${i} was created`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      user: "testuser",
    })),
    quickActions: [
      { id: "create-entity", label: "Create Entity", icon: "add" },
      { id: "search-facts", label: "Search Facts", icon: "search" },
      { id: "view-graph", label: "View Graph", icon: "graph" },
    ],
  }),

  /**
   * Create mock graph visualization data
   */
  createMockGraphVisualization: (
    nodeCount: number = 20,
    linkCount: number = 30
  ) => ({
    nodes: Array.from({ length: nodeCount }, (_, i) => ({
      id: `node-${i}`,
      label: `Entity ${i}`,
      type: i % 3 === 0 ? "person" : i % 3 === 1 ? "organization" : "concept",
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      z: Math.random() * 200 - 100,
      size: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
    })),
    links: Array.from({ length: linkCount }, (_, i) => ({
      id: `link-${i}`,
      source: `node-${Math.floor(Math.random() * nodeCount)}`,
      target: `node-${Math.floor(Math.random() * nodeCount)}`,
      type: ["related_to", "is_a", "has_property"][
        Math.floor(Math.random() * 3)
      ],
      strength: Math.random(),
    })),
    metadata: {
      totalNodes: nodeCount,
      totalLinks: linkCount,
      lastUpdated: new Date().toISOString(),
    },
  }),

  /**
   * Create mock search state
   */
  createMockSearchState: (overrides: any = {}) => ({
    query: "",
    filters: {
      entityTypes: [],
      dateRange: null,
      confidence: { min: 0, max: 1 },
    },
    results: [],
    isLoading: false,
    hasError: false,
    error: null,
    pagination: {
      page: 1,
      pageSize: 20,
      total: 0,
      hasMore: false,
    },
    ...overrides,
  }),

  /**
   * Create mock terminal session
   */
  createMockTerminalSession: (overrides: any = {}) => ({
    id: "terminal-123",
    isConnected: true,
    history: [
      "$ ls",
      "file1.txt  file2.txt  directory/",
      "$ pwd",
      "/home/user",
    ],
    currentCommand: "",
    isExecuting: false,
    ...overrides,
  }),

  /**
   * Create mock WebSocket connection state
   */
  createMockWebSocketState: (overrides: any = {}) => ({
    isConnected: true,
    connectionId: "ws-connection-123",
    lastHeartbeat: new Date().toISOString(),
    messageQueue: [],
    subscriptions: ["entity-updates", "fact-updates"],
    ...overrides,
  }),

  /**
   * Create mock application settings
   */
  createMockAppSettings: (overrides: any = {}) => ({
    theme: "dark",
    language: "en",
    notifications: {
      enabled: true,
      sound: true,
      desktop: false,
    },
    visualization: {
      defaultLayout: "3d",
      animationSpeed: "normal",
      showLabels: true,
    },
    performance: {
      maxNodes: 1000,
      maxLinks: 2000,
      enableCaching: true,
    },
    ...overrides,
  }),
};

export default setupViewfinderTesting;
