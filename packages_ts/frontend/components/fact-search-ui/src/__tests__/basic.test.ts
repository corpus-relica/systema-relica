/**
 * Basic test to verify Jest setup works for fact-search-ui
 */

describe("Basic Jest Setup - Fact Search UI", () => {
  it("should run tests successfully", () => {
    expect(true).toBe(true);
  });

  it("should have access to Jest globals", () => {
    expect(jest).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it("should support async tests", async () => {
    const result = await Promise.resolve("fact-search-test");
    expect(result).toBe("fact-search-test");
  });
});
