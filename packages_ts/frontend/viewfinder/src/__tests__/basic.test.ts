/**
 * Basic test to verify Jest setup works for viewfinder
 */

describe('Basic Jest Setup - Viewfinder', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true);
  });

  it('should have access to Jest globals', () => {
    expect(jest).toBeDefined();
    expect(describe).toBeDefined();
    expect(it).toBeDefined();
    expect(expect).toBeDefined();
  });

  it('should support async tests', async () => {
    const result = await Promise.resolve('viewfinder-test');
    expect(result).toBe('viewfinder-test');
  });
});