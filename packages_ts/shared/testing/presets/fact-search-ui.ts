/**
 * Testing preset for fact-search-ui package
 * Configures all necessary mocks and utilities for fact search component testing
 */

import { setupPackageTesting } from "../index";

/**
 * Setup testing environment specifically for fact-search-ui components
 * Includes Material-UI, WebSocket, Axios, and MobX mocks
 */
export const setupFactSearchUITesting = (): void => {
  setupPackageTesting("fact-search-ui");
};

// Re-export commonly used utilities for convenience
export {
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

// Fact Search specific test utilities
export const factSearchTestUtils = {
  /**
   * Create mock search results for testing
   */
  createMockSearchResults: (count: number = 5) => ({
    results: Array.from({ length: count }, (_, i) => ({
      id: `fact-${i}`,
      subject: `Subject ${i}`,
      predicate: `Predicate ${i}`,
      object: `Object ${i}`,
      confidence: Math.random(),
      timestamp: new Date().toISOString(),
    })),
    total: count,
    page: 1,
    pageSize: 10,
  }),

  /**
   * Create mock query parameters
   */
  createMockQuery: (overrides: any = {}) => ({
    searchTerm: "test query",
    filters: {
      dateRange: {
        start: "2023-01-01",
        end: "2023-12-31",
      },
      confidence: {
        min: 0.5,
        max: 1.0,
      },
    },
    sorting: {
      field: "timestamp",
      direction: "desc",
    },
    pagination: {
      page: 1,
      pageSize: 10,
    },
    ...overrides,
  }),

  /**
   * Create mock table data for testing
   */
  createMockTableData: (rowCount: number = 10) => ({
    columns: [
      { id: "subject", label: "Subject", sortable: true },
      { id: "predicate", label: "Predicate", sortable: true },
      { id: "object", label: "Object", sortable: true },
      { id: "confidence", label: "Confidence", sortable: true },
      { id: "timestamp", label: "Timestamp", sortable: true },
    ],
    rows: Array.from({ length: rowCount }, (_, i) => ({
      id: `row-${i}`,
      subject: `Subject ${i}`,
      predicate: `Predicate ${i}`,
      object: `Object ${i}`,
      confidence: (Math.random() * 0.5 + 0.5).toFixed(2),
      timestamp: new Date(Date.now() - i * 86400000).toISOString(),
    })),
  }),

  /**
   * Mock API responses for fact search
   */
  createMockAPIResponse: (data: any, metadata: any = {}) => ({
    data,
    metadata: {
      total: Array.isArray(data) ? data.length : 1,
      page: 1,
      pageSize: 10,
      hasMore: false,
      ...metadata,
    },
    status: "success",
    timestamp: new Date().toISOString(),
  }),

  /**
   * Create mock filter options
   */
  createMockFilterOptions: () => ({
    subjects: ["Person", "Organization", "Location", "Event"],
    predicates: ["is_a", "has_property", "related_to", "located_in"],
    dateRanges: [
      { label: "Last 7 days", value: 7 },
      { label: "Last 30 days", value: 30 },
      { label: "Last 90 days", value: 90 },
      { label: "Last year", value: 365 },
    ],
    confidenceRanges: [
      { label: "High (0.8+)", min: 0.8, max: 1.0 },
      { label: "Medium (0.5-0.8)", min: 0.5, max: 0.8 },
      { label: "Low (0.0-0.5)", min: 0.0, max: 0.5 },
    ],
  }),
};

export default setupFactSearchUITesting;
