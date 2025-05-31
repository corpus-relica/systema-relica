/**
 * Shared test fixtures and mock data
 * Provides common test data patterns used across all packages
 */

// Common entity types used across the system
export interface TestEntity {
  id: string;
  name: string;
  type: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TestUser {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  roles: string[];
  preferences?: Record<string, any>;
}

export interface TestRelation {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  properties?: Record<string, any>;
}

export interface TestFact {
  id: string;
  subject: string;
  predicate: string;
  object: string;
  context?: string;
  confidence?: number;
  source?: string;
}

// Mock data generators
export const createMockEntity = (
  overrides: Partial<TestEntity> = {}
): TestEntity => ({
  id: `entity-${Math.random().toString(36).substr(2, 9)}`,
  name: `Test Entity ${Math.floor(Math.random() * 1000)}`,
  type: "concept",
  description: "A test entity for testing purposes",
  metadata: {},
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (
  overrides: Partial<TestUser> = {}
): TestUser => ({
  id: `user-${Math.random().toString(36).substr(2, 9)}`,
  username: `testuser${Math.floor(Math.random() * 1000)}`,
  email: `test${Math.floor(Math.random() * 1000)}@example.com`,
  isAdmin: false,
  roles: ["user"],
  preferences: {},
  ...overrides,
});

export const createMockRelation = (
  overrides: Partial<TestRelation> = {}
): TestRelation => ({
  id: `relation-${Math.random().toString(36).substr(2, 9)}`,
  sourceId: `entity-${Math.random().toString(36).substr(2, 9)}`,
  targetId: `entity-${Math.random().toString(36).substr(2, 9)}`,
  type: "relates_to",
  properties: {},
  ...overrides,
});

export const createMockFact = (
  overrides: Partial<TestFact> = {}
): TestFact => ({
  id: `fact-${Math.random().toString(36).substr(2, 9)}`,
  subject: `Subject ${Math.floor(Math.random() * 1000)}`,
  predicate: "is_a",
  object: `Object ${Math.floor(Math.random() * 1000)}`,
  confidence: 0.95,
  source: "test",
  ...overrides,
});

// Predefined test datasets
export const testFixtures = {
  // Users
  users: {
    admin: createMockUser({
      id: "admin-user",
      username: "admin",
      email: "admin@example.com",
      isAdmin: true,
      roles: ["admin", "user"],
    }),

    regularUser: createMockUser({
      id: "regular-user",
      username: "user",
      email: "user@example.com",
      isAdmin: false,
      roles: ["user"],
    }),

    viewer: createMockUser({
      id: "viewer-user",
      username: "viewer",
      email: "viewer@example.com",
      isAdmin: false,
      roles: ["viewer"],
    }),
  },

  // Entities
  entities: {
    concept: createMockEntity({
      id: "concept-1",
      name: "Test Concept",
      type: "concept",
      description: "A test concept entity",
    }),

    relation: createMockEntity({
      id: "relation-1",
      name: "Test Relation",
      type: "relation",
      description: "A test relation entity",
    }),

    individual: createMockEntity({
      id: "individual-1",
      name: "Test Individual",
      type: "individual",
      description: "A test individual entity",
    }),
  },

  // Relations
  relations: {
    isA: createMockRelation({
      id: "is-a-relation",
      type: "is_a",
      properties: { strength: 1.0 },
    }),

    partOf: createMockRelation({
      id: "part-of-relation",
      type: "part_of",
      properties: { strength: 0.8 },
    }),

    relatesTo: createMockRelation({
      id: "relates-to-relation",
      type: "relates_to",
      properties: { strength: 0.6 },
    }),
  },

  // Facts
  facts: {
    simple: createMockFact({
      id: "simple-fact",
      subject: "Dog",
      predicate: "is_a",
      object: "Animal",
      confidence: 1.0,
    }),

    complex: createMockFact({
      id: "complex-fact",
      subject: "Rover",
      predicate: "has_property",
      object: "Brown Color",
      context: "Physical Appearance",
      confidence: 0.9,
    }),
  },

  // 3D Graph specific data
  graph3d: {
    nodes: [
      {
        id: "node-1",
        position: { x: 0, y: 0, z: 0 },
        type: "concept",
        label: "Root Node",
        color: "#ff0000",
        size: 1.0,
      },
      {
        id: "node-2",
        position: { x: 10, y: 0, z: 0 },
        type: "relation",
        label: "Child Node 1",
        color: "#00ff00",
        size: 0.8,
      },
      {
        id: "node-3",
        position: { x: 0, y: 10, z: 0 },
        type: "individual",
        label: "Child Node 2",
        color: "#0000ff",
        size: 0.6,
      },
    ],

    edges: [
      {
        id: "edge-1",
        source: "node-1",
        target: "node-2",
        type: "is_a",
        weight: 1.0,
      },
      {
        id: "edge-2",
        source: "node-1",
        target: "node-3",
        type: "has_part",
        weight: 0.8,
      },
    ],
  },

  // Search/Query results
  searchResults: {
    empty: {
      results: [],
      total: 0,
      page: 1,
      pageSize: 10,
      hasMore: false,
    },

    withResults: {
      results: [
        createMockEntity({ name: "Search Result 1" }),
        createMockEntity({ name: "Search Result 2" }),
        createMockEntity({ name: "Search Result 3" }),
      ],
      total: 3,
      page: 1,
      pageSize: 10,
      hasMore: false,
    },

    paginated: {
      results: Array.from({ length: 10 }, (_, i) =>
        createMockEntity({ name: `Result ${i + 1}` })
      ),
      total: 25,
      page: 1,
      pageSize: 10,
      hasMore: true,
    },
  },

  // WebSocket messages
  websocketMessages: {
    connect: {
      type: "connection",
      status: "connected",
      timestamp: new Date().toISOString(),
    },

    disconnect: {
      type: "connection",
      status: "disconnected",
      timestamp: new Date().toISOString(),
    },

    error: {
      type: "error",
      code: "GENERIC_ERROR",
      message: "A test error occurred",
      timestamp: new Date().toISOString(),
    },

    cacheRebuild: {
      init: {
        type: "cache-rebuild-response",
        status: "accepted",
        cacheType: "all",
        requestId: "test-request-1",
      },

      progress: {
        type: "cache-rebuild-progress",
        requestId: "test-request-1",
        progress: 50,
        stage: "Processing entities",
        detail: "Processed 500/1000 entities",
      },

      complete: {
        type: "cache-rebuild-complete",
        requestId: "test-request-1",
        status: "success",
        summary: {
          entitiesProcessed: 1000,
          relationshipsUpdated: 500,
          duration: "2m 30s",
        },
      },

      error: {
        type: "cache-rebuild-error",
        requestId: "test-request-1",
        error: "Database connection failed",
        code: "DB_ERROR",
      },
    },
  },

  // API responses
  apiResponses: {
    success: {
      status: "success",
      data: null,
      message: "Operation completed successfully",
    },

    error: {
      status: "error",
      error: "Something went wrong",
      code: "GENERIC_ERROR",
    },

    validation: {
      status: "error",
      error: "Validation failed",
      code: "VALIDATION_ERROR",
      details: {
        field: "name",
        message: "Name is required",
      },
    },

    unauthorized: {
      status: "error",
      error: "Unauthorized access",
      code: "UNAUTHORIZED",
    },
  },
};

// Utility functions for creating test data collections
export const createMockEntityCollection = (count: number = 5): TestEntity[] => {
  return Array.from({ length: count }, () => createMockEntity());
};

export const createMockUserCollection = (count: number = 3): TestUser[] => {
  return Array.from({ length: count }, () => createMockUser());
};

export const createMockRelationCollection = (
  count: number = 5
): TestRelation[] => {
  return Array.from({ length: count }, () => createMockRelation());
};

export const createMockFactCollection = (count: number = 10): TestFact[] => {
  return Array.from({ length: count }, () => createMockFact());
};

// Helper for creating realistic test scenarios
export const createTestScenario = (name: string) => {
  const scenarios = {
    "empty-state": {
      entities: [],
      users: [testFixtures.users.admin],
      relations: [],
      facts: [],
    },

    "basic-data": {
      entities: [testFixtures.entities.concept, testFixtures.entities.relation],
      users: [testFixtures.users.admin, testFixtures.users.regularUser],
      relations: [testFixtures.relations.isA],
      facts: [testFixtures.facts.simple],
    },

    "large-dataset": {
      entities: createMockEntityCollection(100),
      users: createMockUserCollection(10),
      relations: createMockRelationCollection(50),
      facts: createMockFactCollection(200),
    },

    "error-scenario": {
      entities: [],
      users: [],
      relations: [],
      facts: [],
      error: "Failed to load data",
    },
  };

  return scenarios[name as keyof typeof scenarios] || scenarios["basic-data"];
};

// Export all fixtures as default
export default testFixtures;
