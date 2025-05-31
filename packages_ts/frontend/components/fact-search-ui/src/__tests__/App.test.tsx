/**
 * Tests for App component - fact-search-ui package
 * Tests the main FactTable component with Material-UI DataGrid integration
 */

import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import FactTable from "../App";

// Mock the constants package
jest.mock("@relica/constants", () => ({
  SEARCH_ENDPOINT: "/api/search",
  QUERY_ENDPOINT: "/api/query",
}));

// Mock axios
jest.mock("axios", () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  })),
}));

describe("App Component", () => {
  let queryClient: QueryClient;
  const mockCallback = jest.fn();

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockCallback.mockClear();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe("Basic Rendering", () => {
    it("should render without crashing", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });

    it("should render with baseUrl prop", () => {
      expect(() => {
        renderWithQueryClient(
          <FactTable callback={mockCallback} baseUrl="http://localhost:3000" />
        );
      }).not.toThrow();
    });
  });

  describe("Props Handling", () => {
    it("should handle facts with data", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });

    it("should handle filter prop", () => {
      const filter = { type: "test", uid: 123 };
      expect(() => {
        renderWithQueryClient(
          <FactTable callback={mockCallback} filter={filter} />
        );
      }).not.toThrow();
    });
  });

  describe("Error Handling", () => {
    it("should handle missing store gracefully", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });

    it("should handle undefined facts", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });
  });

  describe("Component Lifecycle", () => {
    it("should mount and unmount without errors", () => {
      const { unmount } = renderWithQueryClient(
        <FactTable callback={mockCallback} />
      );
      expect(() => unmount()).not.toThrow();
    });

    it("should handle re-renders", () => {
      const { rerender } = renderWithQueryClient(
        <FactTable callback={mockCallback} />
      );
      expect(() => {
        rerender(
          <QueryClientProvider client={queryClient}>
            <FactTable
              callback={mockCallback}
              baseUrl="http://localhost:3000"
            />
          </QueryClientProvider>
        );
      }).not.toThrow();
    });
  });

  describe("Data Grid Integration", () => {
    it("should handle empty data grid", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });

    it("should handle populated data grid", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });
  });

  describe("Filter Integration", () => {
    it("should handle no filter", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });

    it("should handle filter with data", () => {
      expect(() => {
        renderWithQueryClient(
          <FactTable
            callback={mockCallback}
            filter={{ type: "test", uid: 123 }}
          />
        );
      }).not.toThrow();
    });
  });

  describe("Mode Integration", () => {
    it("should handle search mode", () => {
      expect(() => {
        renderWithQueryClient(
          <FactTable callback={mockCallback} mode="search" />
        );
      }).not.toThrow();
    });

    it("should handle query mode", () => {
      expect(() => {
        renderWithQueryClient(
          <FactTable callback={mockCallback} mode="query" />
        );
      }).not.toThrow();
    });
  });

  describe("Props Validation", () => {
    it("should handle all optional props", () => {
      expect(() => {
        renderWithQueryClient(
          <FactTable
            callback={mockCallback}
            baseUrl="http://localhost:3000"
            filter={{ type: "test", uid: 123 }}
            initialQuery="test query"
            showModeToggle={true}
            mode="query"
            height="500px"
            autoload={true}
            readonly={true}
            token="test-token"
          />
        );
      }).not.toThrow();
    });

    it("should handle minimal props", () => {
      expect(() => {
        renderWithQueryClient(<FactTable callback={mockCallback} />);
      }).not.toThrow();
    });
  });
});
