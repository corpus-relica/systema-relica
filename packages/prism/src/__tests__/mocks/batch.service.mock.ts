export const mockBatchService = {
  seedDatabase: jest.fn(),
  processSeedDirectory: jest.fn(),
};

// Default return values for common scenarios
export const setupBatchMockDefaults = () => {
  mockBatchService.seedDatabase.mockResolvedValue({ success: true });
  mockBatchService.processSeedDirectory.mockReturnValue([
    '/path/to/0.csv',
    '/path/to/1.csv'
  ]);
};

// Scenario-specific setups
export const setupBatchForSuccessfulSeeding = () => {
  mockBatchService.seedDatabase.mockResolvedValue({ success: true });
};

export const setupBatchForSeedingError = () => {
  mockBatchService.seedDatabase.mockResolvedValue({ 
    success: false, 
    error: 'No CSV files to process' 
  });
};

export const setupBatchForSeedingException = () => {
  mockBatchService.seedDatabase.mockRejectedValue(new Error('Seeding failed'));
};

export const setupBatchForNoFiles = () => {
  mockBatchService.processSeedDirectory.mockReturnValue([]);
  mockBatchService.seedDatabase.mockResolvedValue({ 
    success: false, 
    error: 'No CSV files to process' 
  });
};