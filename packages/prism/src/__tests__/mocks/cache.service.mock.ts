export const mockCacheService = {
  buildEntityFactsCache: jest.fn(),
  buildEntityLineageCache: jest.fn(),
  buildSubtypesCache: jest.fn(),
  rebuildAllCaches: jest.fn(),
  clearCache: jest.fn(),
  getRebuildStatus: jest.fn(),
  resetRebuildStatus: jest.fn(),
};

// Default return values for common scenarios
export const setupCacheMockDefaults = () => {
  mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
  mockCacheService.buildEntityLineageCache.mockResolvedValue(true);
  mockCacheService.buildSubtypesCache.mockResolvedValue(true);
  mockCacheService.rebuildAllCaches.mockResolvedValue(true);
  mockCacheService.clearCache.mockResolvedValue({ success: true });
  mockCacheService.getRebuildStatus.mockReturnValue({
    status: 'idle',
    progress: 0,
  });
  mockCacheService.resetRebuildStatus.mockReturnValue(undefined);
};

// Scenario-specific setups
export const setupCacheForSuccessfulBuilding = () => {
  mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
  mockCacheService.buildEntityLineageCache.mockResolvedValue(true);
  mockCacheService.buildSubtypesCache.mockResolvedValue(true);
};

export const setupCacheForFactsBuildingError = () => {
  mockCacheService.buildEntityFactsCache.mockResolvedValue(false);
};

export const setupCacheForLineageBuildingError = () => {
  mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
  mockCacheService.buildEntityLineageCache.mockResolvedValue(false);
};

export const setupCacheForSubtypesBuildingError = () => {
  mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
  mockCacheService.buildEntityLineageCache.mockResolvedValue(true);
  mockCacheService.buildSubtypesCache.mockResolvedValue(false);
};

export const setupCacheForBuildingException = (stage: 'facts' | 'lineage' | 'subtypes') => {
  const error = new Error(`${stage} cache building failed`);
  
  switch (stage) {
    case 'facts':
      mockCacheService.buildEntityFactsCache.mockRejectedValue(error);
      break;
    case 'lineage':
      mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
      mockCacheService.buildEntityLineageCache.mockRejectedValue(error);
      break;
    case 'subtypes':
      mockCacheService.buildEntityFactsCache.mockResolvedValue(true);
      mockCacheService.buildEntityLineageCache.mockResolvedValue(true);
      mockCacheService.buildSubtypesCache.mockRejectedValue(error);
      break;
  }
};

export const setupCacheForClearError = () => {
  mockCacheService.clearCache.mockResolvedValue({ 
    success: false, 
    error: 'Failed to clear cache' 
  });
};