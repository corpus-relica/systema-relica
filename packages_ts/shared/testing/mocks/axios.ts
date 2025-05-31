import { AxiosRequestConfig, AxiosResponse, AxiosError } from "axios";

/**
 * Axios mock utilities for testing HTTP requests
 * Provides comprehensive mocking for API calls used across packages
 */

export interface MockAxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: AxiosRequestConfig;
}

export interface MockAxiosError {
  message: string;
  code?: string;
  status?: number;
  response?: Partial<AxiosResponse>;
}

export class MockAxiosAdapter {
  private handlers: Map<
    string,
    (config: AxiosRequestConfig) => Promise<MockAxiosResponse | MockAxiosError>
  > = new Map();
  private defaultDelay: number = 0;

  constructor(defaultDelay: number = 0) {
    this.defaultDelay = defaultDelay;
  }

  // Register a mock handler for a specific method and URL pattern
  onRequest(
    method: string,
    urlPattern: string | RegExp,
    handler: (
      config: AxiosRequestConfig
    ) => Promise<MockAxiosResponse | MockAxiosError>
  ): void {
    const key = `${method.toUpperCase()}:${urlPattern.toString()}`;
    this.handlers.set(key, handler);
  }

  // Convenience methods for common HTTP methods
  onGet(
    urlPattern: string | RegExp,
    handler: (
      config: AxiosRequestConfig
    ) => Promise<MockAxiosResponse | MockAxiosError>
  ): void {
    this.onRequest("GET", urlPattern, handler);
  }

  onPost(
    urlPattern: string | RegExp,
    handler: (
      config: AxiosRequestConfig
    ) => Promise<MockAxiosResponse | MockAxiosError>
  ): void {
    this.onRequest("POST", urlPattern, handler);
  }

  onPut(
    urlPattern: string | RegExp,
    handler: (
      config: AxiosRequestConfig
    ) => Promise<MockAxiosResponse | MockAxiosError>
  ): void {
    this.onRequest("PUT", urlPattern, handler);
  }

  onDelete(
    urlPattern: string | RegExp,
    handler: (
      config: AxiosRequestConfig
    ) => Promise<MockAxiosResponse | MockAxiosError>
  ): void {
    this.onRequest("DELETE", urlPattern, handler);
  }

  onPatch(
    urlPattern: string | RegExp,
    handler: (
      config: AxiosRequestConfig
    ) => Promise<MockAxiosResponse | MockAxiosError>
  ): void {
    this.onRequest("PATCH", urlPattern, handler);
  }

  // Find and execute the appropriate handler
  async handleRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
    const method = (config.method || "GET").toUpperCase();
    const url = config.url || "";

    // Find matching handler
    for (const [key, handler] of this.handlers) {
      const [handlerMethod, handlerPattern] = key.split(":", 2);

      if (handlerMethod === method) {
        const pattern = handlerPattern.startsWith("/")
          ? new RegExp(handlerPattern.slice(1, -1))
          : handlerPattern;
        const matches =
          typeof pattern === "string"
            ? url.includes(pattern)
            : pattern.test(url);

        if (matches) {
          // Add delay if specified
          if (this.defaultDelay > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.defaultDelay)
            );
          }

          const result = await handler(config);

          // Check if result is an error
          if ("message" in result) {
            const error = new Error(result.message) as AxiosError;
            error.code = result.code;
            error.response = result.response as AxiosResponse;
            throw error;
          }

          return result as AxiosResponse;
        }
      }
    }

    // No handler found, return 404
    const error = new Error(
      `No mock handler found for ${method} ${url}`
    ) as AxiosError;
    error.response = {
      status: 404,
      statusText: "Not Found",
      data: { message: "Mock endpoint not found" },
      headers: {},
      config,
    } as AxiosResponse;
    throw error;
  }

  // Clear all handlers
  reset(): void {
    this.handlers.clear();
  }

  // Set default delay for all requests
  setDefaultDelay(delay: number): void {
    this.defaultDelay = delay;
  }
}

// Helper functions for creating common responses
export const createMockResponse = <T = any>(
  data: T,
  status: number = 200,
  statusText: string = "OK",
  headers: Record<string, string> = {}
): MockAxiosResponse<T> => ({
  data,
  status,
  statusText,
  headers: {
    "content-type": "application/json",
    ...headers,
  },
  config: {},
});

export const createMockError = (
  message: string,
  status: number = 500,
  code?: string
): MockAxiosError => ({
  message,
  code,
  status,
  response: {
    status,
    statusText: getStatusText(status),
    data: { message },
    headers: {},
  },
});

// Helper to get status text from status code
const getStatusText = (status: number): string => {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    422: "Unprocessable Entity",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[status] || "Unknown";
};

// Global axios mock setup
export const setupAxiosMock = (): MockAxiosAdapter => {
  const adapter = new MockAxiosAdapter();

  // Mock axios create function
  const mockAxios = {
    create: jest.fn(() => mockAxios),
    request: jest.fn((config: AxiosRequestConfig) =>
      adapter.handleRequest(config)
    ),
    get: jest.fn((url: string, config?: AxiosRequestConfig) =>
      adapter.handleRequest({ ...config, method: "GET", url })
    ),
    post: jest.fn((url: string, data?: any, config?: AxiosRequestConfig) =>
      adapter.handleRequest({ ...config, method: "POST", url, data })
    ),
    put: jest.fn((url: string, data?: any, config?: AxiosRequestConfig) =>
      adapter.handleRequest({ ...config, method: "PUT", url, data })
    ),
    delete: jest.fn((url: string, config?: AxiosRequestConfig) =>
      adapter.handleRequest({ ...config, method: "DELETE", url })
    ),
    patch: jest.fn((url: string, data?: any, config?: AxiosRequestConfig) =>
      adapter.handleRequest({ ...config, method: "PATCH", url, data })
    ),
    head: jest.fn((url: string, config?: AxiosRequestConfig) =>
      adapter.handleRequest({ ...config, method: "HEAD", url })
    ),
    options: jest.fn((url: string, config?: AxiosRequestConfig) =>
      adapter.handleRequest({ ...config, method: "OPTIONS", url })
    ),
    defaults: {
      headers: {
        common: {},
        get: {},
        post: {},
        put: {},
        patch: {},
        delete: {},
        head: {},
        options: {},
      },
      timeout: 0,
      baseURL: "",
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };

  // Replace axios module
  jest.doMock("axios", () => mockAxios);

  return adapter;
};

// Cleanup function
export const cleanupAxiosMock = (): void => {
  jest.clearAllMocks();
  jest.dontMock("axios");
};
