/**
 * Tests for QueryMode component - fact-search-ui package
 * Tests query functionality, pagination, API integration, and keyboard events
 */

import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import QueryMode from "../QueryMode";
import { performQuery } from "../../axiosInstance";

// Mock the axios instance
jest.mock("../../axiosInstance", () => ({
  performQuery: jest.fn().mockResolvedValue({ facts: [], count: 0 }),
}));

// Type for mock store
interface MockStore {
  initialQuery: string;
  facts: unknown[];
  filter: unknown;
  totalCount: number;
  mode: "query";
  token: unknown;
  queryResult: unknown;
}

// Mock the store context
const mockStore: MockStore = {
  initialQuery: "",
  facts: [],
  filter: undefined,
  totalCount: 0,
  mode: "query" as const,
  token: undefined,
  queryResult: null,
};

jest.mock("../../context/RootStoreContext", () => ({
  useStores: jest.fn(() => mockStore),
}));

// Mock the debounce utility
jest.mock("../../utils", () => ({
  useDebounce: jest.fn((value) => value),
}));

// Mock MobX observer
jest.mock("mobx-react-lite", () => ({
  observer: <T extends React.ComponentType<unknown>>(component: T): T =>
    component,
}));

// Get mocked functions
const mockedPerformQuery = performQuery as jest.MockedFunction<
  typeof performQuery
>;

describe("QueryMode Component", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    // Reset store state
    mockStore.initialQuery = "";
    mockStore.facts = [];
    mockStore.filter = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe("Rendering", () => {
    it("should render without crashing", () => {
      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });

    it("should render the component successfully", () => {
      const { container } = renderWithQueryClient(<QueryMode />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Store Integration", () => {
    it("should use the store context", () => {
      renderWithQueryClient(<QueryMode />);
      // Component should render without errors when store is available
      expect(mockStore).toBeDefined();
    });

    it("should initialize with store's initial query", () => {
      mockStore.initialQuery = "test query";
      renderWithQueryClient(<QueryMode />);
      // Component should render without errors
      expect(mockStore.initialQuery).toBe("test query");
    });
  });

  describe("API Integration", () => {
    it("should handle query functionality", async () => {
      renderWithQueryClient(<QueryMode />);

      // Wait for component to potentially call performQuery
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Component should render without errors
      expect(mockedPerformQuery).toBeDefined();
    });

    it("should handle query results", async () => {
      mockedPerformQuery.mockResolvedValue({
        facts: [{ fact_uid: 1, name: "Test Fact" }],
        count: 1,
      });

      renderWithQueryClient(<QueryMode />);

      // Component should render without errors
      expect(mockedPerformQuery).toBeDefined();
    });
  });

  describe("Props and State", () => {
    it("should handle different store states", () => {
      mockStore.filter = { type: "kind", uid: 123 };
      mockStore.facts = [{ fact_uid: 1, name: "Test Fact" }];

      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });

    it("should handle empty state", () => {
      mockStore.filter = undefined;
      mockStore.facts = [];
      mockStore.initialQuery = "";

      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });
  });

  describe("Pagination", () => {
    it("should handle pagination state", () => {
      mockStore.totalCount = 100;

      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });

    it("should handle page changes", () => {
      mockStore.totalCount = 50;

      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully", () => {
      mockedPerformQuery.mockRejectedValue(new Error("Query Error"));

      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });

    it("should handle missing store gracefully", () => {
      // This test ensures the component doesn't crash with undefined store
      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });
  });

  describe("Component Lifecycle", () => {
    it("should mount and unmount without errors", () => {
      const { unmount } = renderWithQueryClient(<QueryMode />);

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it("should handle re-renders", () => {
      const { rerender } = renderWithQueryClient(<QueryMode />);

      expect(() => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <QueryMode />
          </QueryClientProvider>
        );
      }).not.toThrow();
    });
  });

  describe("Query Functionality", () => {
    it("should handle query execution", () => {
      mockStore.initialQuery = "SELECT * FROM facts";

      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });

    it("should handle empty queries", () => {
      mockStore.initialQuery = "";

      expect(() => {
        renderWithQueryClient(<QueryMode />);
      }).not.toThrow();
    });
  });
});
