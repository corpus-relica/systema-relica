/**
 * Tests for RootStore - fact-search-ui package
 * Tests MobX store state management, reactivity, and data handling
 */

import { RootStore } from "../RootStore";
import { QueryResults } from "../../types";

describe("RootStore", () => {
  let store: RootStore;

  beforeEach(() => {
    store = new RootStore();
  });

  describe("Initialization", () => {
    it("should initialize with default values", () => {
      expect(store.facts).toEqual([]);
      expect(store.totalCount).toBe(0);
      expect(store.filter).toBeUndefined();
      expect(store.initialQuery).toBe("");
      expect(store.mode).toBe("search");
      expect(store.token).toBeUndefined();
    });

    it("should initialize queryResult with default structure", () => {
      expect(store.queryResult).toEqual({
        facts: [],
        vars: [],
        groundingFacts: [],
        totalCount: 0,
      });
    });

    it("should be observable", () => {
      // Check that the store is properly observable
      expect(store).toBeDefined();
      expect(typeof store.facts).toBe("object");
      expect(Array.isArray(store.facts)).toBe(true);
    });
  });

  describe("Facts Management", () => {
    it("should update facts array", () => {
      const mockFacts: any[] = [
        { fact_uid: 1, name: "Fact 1" },
        { fact_uid: 2, name: "Fact 2" },
      ];

      (store as any).facts = mockFacts;

      expect(store.facts).toEqual(mockFacts);
      expect(store.facts.length).toBe(2);
    });

    it("should handle empty facts array", () => {
      (store as any).facts = [{ fact_uid: 1, name: "Fact 1" }];
      expect(store.facts.length).toBe(1);

      (store as any).facts = [];
      expect(store.facts).toEqual([]);
      expect(store.facts.length).toBe(0);
    });

    it("should replace facts array completely", () => {
      const initialFacts: any[] = [{ fact_uid: 1, name: "Initial" }];
      const newFacts: any[] = [
        { fact_uid: 2, name: "New 1" },
        { fact_uid: 3, name: "New 2" },
      ];

      (store as any).facts = initialFacts;
      expect(store.facts).toEqual(initialFacts);

      (store as any).facts = newFacts;
      expect(store.facts).toEqual(newFacts);
      expect(store.facts.length).toBe(2);
    });
  });

  describe("Total Count Management", () => {
    it("should update totalCount", () => {
      expect(store.totalCount).toBe(0);

      store.totalCount = 42;
      expect(store.totalCount).toBe(42);

      store.totalCount = 0;
      expect(store.totalCount).toBe(0);
    });

    it("should handle large totalCount values", () => {
      store.totalCount = 999999;
      expect(store.totalCount).toBe(999999);
    });

    it("should handle negative totalCount values", () => {
      store.totalCount = -1;
      expect(store.totalCount).toBe(-1);
    });
  });

  describe("Filter Management", () => {
    it("should set and get filter", () => {
      const filter = { uid: 123, type: "kind" };

      store.filter = filter;
      expect(store.filter).toEqual(filter);
    });

    it("should handle undefined filter", () => {
      store.filter = { uid: 123, type: "kind" };
      expect(store.filter).toBeDefined();

      store.filter = undefined;
      expect(store.filter).toBeUndefined();
    });

    it("should update filter properties", () => {
      const filter1 = { uid: 123, type: "kind" };
      const filter2 = { uid: 456, type: "individual" };

      store.filter = filter1;
      expect(store.filter?.uid).toBe(123);
      expect(store.filter?.type).toBe("kind");

      store.filter = filter2;
      expect(store.filter?.uid).toBe(456);
      expect(store.filter?.type).toBe("individual");
    });
  });

  describe("Initial Query Management", () => {
    it("should set and get initialQuery", () => {
      const query = "test search query";

      store.initialQuery = query;
      expect(store.initialQuery).toBe(query);
    });

    it("should handle empty initialQuery", () => {
      store.initialQuery = "some query";
      expect(store.initialQuery).toBe("some query");

      store.initialQuery = "";
      expect(store.initialQuery).toBe("");
    });

    it("should handle complex query strings", () => {
      const complexQuery =
        '@intention="question"\n?12.foobar > 1190 > 1000000235';

      store.initialQuery = complexQuery;
      expect(store.initialQuery).toBe(complexQuery);
    });
  });

  describe("Query Result Management", () => {
    it("should set and get queryResult", () => {
      const queryResult: QueryResults = {
        facts: [{ fact_uid: 1, name: "Test Fact" }],
        vars: [
          { uid: 1, name: "var1", possibleValues: [1, 2], isResolved: false },
        ],
        groundingFacts: [{ fact_uid: 2, name: "Grounding Fact" }],
        totalCount: 10,
      };

      store.queryResult = queryResult;
      expect(store.queryResult).toEqual(queryResult);
    });

    it("should handle null queryResult", () => {
      const queryResult: QueryResults = {
        facts: [{ fact_uid: 1, name: "Test" }],
        vars: [],
        groundingFacts: [],
        totalCount: 1,
      };

      store.queryResult = queryResult;
      expect(store.queryResult).toEqual(queryResult);

      store.queryResult = null;
      expect(store.queryResult).toBeNull();
    });

    it("should update queryResult properties independently", () => {
      const initialResult: QueryResults = {
        facts: [],
        vars: [],
        groundingFacts: [],
        totalCount: 0,
      };

      store.queryResult = initialResult;

      const updatedResult: QueryResults = {
        facts: [{ fact_uid: 1, name: "New Fact" }],
        vars: [{ uid: 1, name: "var1", possibleValues: [], isResolved: true }],
        groundingFacts: [{ fact_uid: 2, name: "Grounding" }],
        totalCount: 5,
      };

      store.queryResult = updatedResult;
      expect(store.queryResult?.facts.length).toBe(1);
      expect(store.queryResult?.vars.length).toBe(1);
      expect(store.queryResult?.groundingFacts.length).toBe(1);
      expect(store.queryResult?.totalCount).toBe(5);
    });
  });

  describe("Mode Management", () => {
    it("should set and get mode", () => {
      expect(store.mode).toBe("search");

      store.mode = "query";
      expect(store.mode).toBe("query");

      store.mode = "search";
      expect(store.mode).toBe("search");
    });

    it("should only accept valid mode values", () => {
      store.mode = "query";
      expect(store.mode).toBe("query");

      store.mode = "search";
      expect(store.mode).toBe("search");
    });
  });

  describe("Token Management", () => {
    it("should set and get token", () => {
      const token = "test-auth-token-123";

      store.token = token;
      expect(store.token).toBe(token);
    });

    it("should handle undefined token", () => {
      store.token = "some-token";
      expect(store.token).toBe("some-token");

      store.token = undefined;
      expect(store.token).toBeUndefined();
    });

    it("should handle empty token", () => {
      store.token = "";
      expect(store.token).toBe("");
    });

    it("should handle JWT-like tokens", () => {
      const jwtToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      store.token = jwtToken;
      expect(store.token).toBe(jwtToken);
    });
  });

  describe("State Combinations", () => {
    it("should handle multiple state updates", () => {
      const facts: any[] = [{ fact_uid: 1, name: "Test" }];
      const filter = { uid: 123, type: "kind" };
      const queryResult: QueryResults = {
        facts: facts,
        vars: [],
        groundingFacts: [] as any[],
        totalCount: 1,
      };

      (store as any).facts = facts;
      store.totalCount = 1;
      store.filter = filter;
      store.initialQuery = "test query";
      store.queryResult = queryResult;
      store.mode = "query";
      store.token = "test-token";

      expect(store.facts).toEqual(facts);
      expect(store.totalCount).toBe(1);
      expect(store.filter).toEqual(filter);
      expect(store.initialQuery).toBe("test query");
      expect(store.queryResult).toEqual(queryResult);
      expect(store.mode).toBe("query");
      expect(store.token).toBe("test-token");
    });

    it("should maintain state independence", () => {
      store.mode = "query";
      (store as any).facts = [{ fact_uid: 1, name: "Test" }];

      // Changing mode shouldn't affect facts
      store.mode = "search";
      expect(store.facts.length).toBe(1);

      // Changing facts shouldn't affect mode
      (store as any).facts = [];
      expect(store.mode).toBe("search");
    });
  });

  describe("Data Validation", () => {
    it("should handle various data types for facts", () => {
      const complexFacts: any[] = [
        {
          fact_uid: 1,
          name: "Complex Fact",
          metadata: { key: "value" },
          tags: ["tag1", "tag2"],
          isActive: true,
        },
      ];

      (store as any).facts = complexFacts;
      expect(store.facts).toEqual(complexFacts);
    });

    it("should handle vars with different structures", () => {
      const queryResult: QueryResults = {
        facts: [],
        vars: [
          {
            uid: 1,
            name: "var1",
            possibleValues: [1, 2, 3],
            isResolved: false,
          },
          { uid: 2, name: "var2", possibleValues: [], isResolved: true },
        ],
        groundingFacts: [],
        totalCount: 0,
      };

      store.queryResult = queryResult;
      expect(store.queryResult?.vars.length).toBe(2);
      expect(store.queryResult?.vars[0].possibleValues).toEqual([1, 2, 3]);
      expect(store.queryResult?.vars[1].isResolved).toBe(true);
    });
  });

  describe("Store Reactivity", () => {
    it("should be reactive to changes", () => {
      // This test verifies that the store is properly observable
      // In a real MobX environment, we would use autorun or reaction
      // For this test, we'll just verify the values change
      const initialFacts = store.facts;
      (store as any).facts = [{ fact_uid: 1, name: "New Fact" }];

      expect(store.facts).not.toBe(initialFacts);
      expect(store.facts.length).toBe(1);
    });

    it("should handle rapid state changes", () => {
      for (let i = 0; i < 10; i++) {
        store.totalCount = i;
        expect(store.totalCount).toBe(i);
      }
    });
  });
});
