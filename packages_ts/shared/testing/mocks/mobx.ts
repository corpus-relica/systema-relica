import { configure } from "mobx";

/**
 * MobX testing utilities and mocks
 * Provides utilities for testing MobX stores across all packages
 */

// Configure MobX for testing environment
export const configureMobxForTesting = (): void => {
  configure({
    enforceActions: "never",
    computedRequiresReaction: false,
    reactionRequiresObservable: false,
    observableRequiresReaction: false,
    disableErrorBoundaries: true,
  });
};

// Base mock store class
export class MockStore {
  private _isDestroyed: boolean = false;

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  destroy(): void {
    this._isDestroyed = true;
  }

  reset(): void {
    // Override in subclasses to reset store state
  }
}

// Mock RootStore for testing
export class MockRootStore extends MockStore {
  public stores: Map<string, MockStore> = new Map();

  addStore(name: string, store: MockStore): void {
    this.stores.set(name, store);
  }

  getStore<T extends MockStore>(name: string): T | undefined {
    return this.stores.get(name) as T;
  }

  reset(): void {
    this.stores.forEach((store) => store.reset());
  }

  destroy(): void {
    this.stores.forEach((store) => store.destroy());
    this.stores.clear();
    super.destroy();
  }
}

// Mock data store with common patterns
export class MockDataStore extends MockStore {
  public data: any[] = [];
  public loading: boolean = false;
  public error: string | null = null;
  public selectedItem: any = null;

  constructor(initialData: any[] = []) {
    super();
    this.data = [...initialData];
  }

  setLoading(loading: boolean): void {
    this.loading = loading;
  }

  setError(error: string | null): void {
    this.error = error;
  }

  setData(data: any[]): void {
    this.data = [...data];
  }

  addItem(item: any): void {
    this.data.push(item);
  }

  removeItem(id: string | number): void {
    this.data = this.data.filter((item) => item.id !== id);
  }

  updateItem(id: string | number, updates: Partial<any>): void {
    const index = this.data.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.data[index] = { ...this.data[index], ...updates };
    }
  }

  selectItem(item: any): void {
    this.selectedItem = item;
  }

  clearSelection(): void {
    this.selectedItem = null;
  }

  reset(): void {
    this.data = [];
    this.loading = false;
    this.error = null;
    this.selectedItem = null;
  }
}

// Mock UI store for common UI state
export class MockUIStore extends MockStore {
  public sidebarOpen: boolean = false;
  public theme: "light" | "dark" = "light";
  public notifications: any[] = [];
  public modals: Map<string, boolean> = new Map();

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  setSidebarOpen(open: boolean): void {
    this.sidebarOpen = open;
  }

  setTheme(theme: "light" | "dark"): void {
    this.theme = theme;
  }

  addNotification(notification: any): void {
    this.notifications.push({
      id: Date.now().toString(),
      timestamp: new Date(),
      ...notification,
    });
  }

  removeNotification(id: string): void {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  clearNotifications(): void {
    this.notifications = [];
  }

  openModal(modalId: string): void {
    this.modals.set(modalId, true);
  }

  closeModal(modalId: string): void {
    this.modals.set(modalId, false);
  }

  isModalOpen(modalId: string): boolean {
    return this.modals.get(modalId) || false;
  }

  reset(): void {
    this.sidebarOpen = false;
    this.theme = "light";
    this.notifications = [];
    this.modals.clear();
  }
}

// Mock cache store for cache-related testing
export class MockCacheStore extends MockStore {
  public cacheStatus: "idle" | "rebuilding" | "complete" | "error" = "idle";
  public progress: number = 0;
  public stage: string = "";
  public detail: string = "";
  public error: string | null = null;
  public selectedCacheType: string = "all";
  public lastRebuildTime: Date | null = null;

  startRebuild(cacheType: string = "all"): void {
    this.selectedCacheType = cacheType;
    this.cacheStatus = "rebuilding";
    this.progress = 0;
    this.stage = "Initializing";
    this.detail = "";
    this.error = null;
  }

  updateProgress(progress: number, stage: string, detail: string): void {
    this.progress = progress;
    this.stage = stage;
    this.detail = detail;
  }

  completeRebuild(): void {
    this.cacheStatus = "complete";
    this.progress = 100;
    this.stage = "Complete";
    this.detail = "Cache rebuild completed successfully";
    this.lastRebuildTime = new Date();
  }

  setError(error: string): void {
    this.cacheStatus = "error";
    this.error = error;
  }

  reset(): void {
    this.cacheStatus = "idle";
    this.progress = 0;
    this.stage = "";
    this.detail = "";
    this.error = null;
    this.selectedCacheType = "all";
    this.lastRebuildTime = null;
  }
}

// Store factory for creating test stores
export class MockStoreFactory {
  static createRootStore(): MockRootStore {
    const rootStore = new MockRootStore();

    // Add common stores
    rootStore.addStore("ui", new MockUIStore());
    rootStore.addStore("cache", new MockCacheStore());

    return rootStore;
  }

  static createDataStore(initialData: any[] = []): MockDataStore {
    return new MockDataStore(initialData);
  }

  static createUIStore(): MockUIStore {
    return new MockUIStore();
  }

  static createCacheStore(): MockCacheStore {
    return new MockCacheStore();
  }
}

// React context helpers for testing
export const createMockStoreContext = (
  stores: Record<string, MockStore> = {}
) => {
  const rootStore = MockStoreFactory.createRootStore();

  // Add custom stores
  Object.entries(stores).forEach(([name, store]) => {
    rootStore.addStore(name, store);
  });

  return {
    rootStore,
    Provider: ({ children }: any) => children, // Mock provider that just passes children
    useStore: jest.fn(() => rootStore),
    useStores: jest.fn(() => rootStore.stores),
  };
};

// Test utilities
export const waitForStoreUpdate = async (
  store: MockStore,
  condition: () => boolean,
  timeout: number = 5000
): Promise<void> => {
  const startTime = Date.now();

  while (!condition() && Date.now() - startTime < timeout) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  if (!condition()) {
    throw new Error("Store update condition not met within timeout");
  }
};

export const mockStoreAction = <T extends MockStore>(
  store: T,
  actionName: string,
  implementation?: (...args: any[]) => any
): jest.SpyInstance => {
  const spy = jest.spyOn(store, actionName as any);

  if (implementation) {
    spy.mockImplementation(implementation);
  }

  return spy;
};

export const expectStoreState = (
  store: MockStore,
  expectedState: Partial<any>
): void => {
  Object.entries(expectedState).forEach(([key, value]) => {
    expect((store as any)[key]).toEqual(value);
  });
};

// Setup function for Jest
export const setupMobxMock = (): void => {
  configureMobxForTesting();

  // Mock mobx-react-lite
  jest.doMock("mobx-react-lite", () => ({
    observer: (component: any) => component,
    Observer: ({ children }: any) => children(),
    useLocalObservable: jest.fn((initializer: any) => initializer()),
    useObserver: jest.fn((fn: any) => fn()),
    enableStaticRendering: jest.fn(),
  }));

  // Mock mobx-react
  jest.doMock("mobx-react", () => ({
    observer: (component: any) => component,
    Observer: ({ children }: any) => children(),
    inject: () => (component: any) => component,
    Provider: ({ children }: any) => children,
  }));
};

// Cleanup function
export const cleanupMobxMock = (): void => {
  jest.dontMock("mobx-react-lite");
  jest.dontMock("mobx-react");
};

// Export commonly used test data
export const mockTestData = {
  users: [
    { id: "1", name: "John Doe", email: "john@example.com", isAdmin: true },
    { id: "2", name: "Jane Smith", email: "jane@example.com", isAdmin: false },
    { id: "3", name: "Bob Johnson", email: "bob@example.com", isAdmin: false },
  ],

  entities: [
    {
      id: "1",
      name: "Entity 1",
      type: "concept",
      description: "Test entity 1",
    },
    {
      id: "2",
      name: "Entity 2",
      type: "relation",
      description: "Test entity 2",
    },
    { id: "3", name: "Entity 3", type: "fact", description: "Test entity 3" },
  ],

  notifications: [
    {
      id: "1",
      type: "info",
      message: "Test info notification",
      timestamp: new Date(),
    },
    {
      id: "2",
      type: "warning",
      message: "Test warning notification",
      timestamp: new Date(),
    },
    {
      id: "3",
      type: "error",
      message: "Test error notification",
      timestamp: new Date(),
    },
  ],
};
