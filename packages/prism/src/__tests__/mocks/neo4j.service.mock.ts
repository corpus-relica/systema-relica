export const mockNeo4jService = {
  isDatabaseEmpty: jest.fn(),
  loadNodesFromCsv: jest.fn(),
  loadRelationshipsFromCsv: jest.fn(),
  clearDatabase: jest.fn(),
  executeQuery: jest.fn(),
  withRetry: jest.fn(),
  getSession: jest.fn(),
  onModuleInit: jest.fn(),
  onModuleDestroy: jest.fn(),
};

// Default return values for common scenarios
export const setupNeo4jMockDefaults = () => {
  mockNeo4jService.isDatabaseEmpty.mockResolvedValue(true);
  mockNeo4jService.loadNodesFromCsv.mockResolvedValue({ success: true });
  mockNeo4jService.loadRelationshipsFromCsv.mockResolvedValue({ success: true });
  mockNeo4jService.clearDatabase.mockResolvedValue({ success: true });
  mockNeo4jService.executeQuery.mockResolvedValue({ success: true, results: [] });
  mockNeo4jService.withRetry.mockImplementation((operation) => operation());
};

// Scenario-specific setups
export const setupNeo4jForEmptyDatabase = () => {
  mockNeo4jService.isDatabaseEmpty.mockResolvedValue(true);
};

export const setupNeo4jForNonEmptyDatabase = () => {
  mockNeo4jService.isDatabaseEmpty.mockResolvedValue(false);
};

export const setupNeo4jForConnectionError = () => {
  mockNeo4jService.isDatabaseEmpty.mockRejectedValue(new Error('Connection failed'));
};

export const setupNeo4jForLoadingError = () => {
  mockNeo4jService.loadNodesFromCsv.mockResolvedValue({ 
    success: false, 
    error: 'Failed to load nodes' 
  });
};

export const setupNeo4jForClearError = () => {
  mockNeo4jService.clearDatabase.mockResolvedValue({ 
    success: false, 
    error: 'Failed to clear database' 
  });
};