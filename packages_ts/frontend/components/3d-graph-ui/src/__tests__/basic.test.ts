/**
 * Basic test to verify Jest setup works
 */

describe("Basic Jest Setup", () => {
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
    const result = await Promise.resolve("test");
    expect(result).toBe("test");
  });
});
