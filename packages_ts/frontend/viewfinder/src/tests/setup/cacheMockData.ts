export const mockCacheRebuildEvents = {
  // Initial request response
  initResponse: {
    type: 'cache-rebuild-response',
    status: 'accepted',
    cacheType: 'all',
    requestId: 'test-request-1'
  },

  // Progress updates
  progress: {
    type: 'cache-rebuild-progress',
    requestId: 'test-request-1',
    progress: 45,
    stage: 'Processing entities',
    detail: 'Processed 450/1000 entities'
  },

  // Completion event
  completion: {
    type: 'cache-rebuild-complete',
    requestId: 'test-request-1',
    status: 'success',
    summary: {
      entitiesProcessed: 1000,
      relationshipsUpdated: 500,
      duration: '2m 30s'
    }
  },

  // Error scenarios
  error: {
    type: 'cache-rebuild-error',
    requestId: 'test-request-1',
    error: 'Database connection failed',
    code: 'DB_ERROR'
  },

  unauthorized: {
    type: 'error',
    code: 'UNAUTHORIZED',
    message: 'Admin privileges required for cache rebuild'
  },

  // Different cache types
  entityCacheOnly: {
    type: 'cache-rebuild-response',
    status: 'accepted',
    cacheType: 'entity',
    requestId: 'test-request-2'
  },

  relationshipCacheOnly: {
    type: 'cache-rebuild-response',
    status: 'accepted',
    cacheType: 'relationship',
    requestId: 'test-request-3'
  }
};

export const mockCacheTypes = [
  { id: 'all', label: 'All Caches', description: 'Rebuild all cache types' },
  { id: 'entity', label: 'Entity Cache', description: 'Rebuild entity cache only' },
  { id: 'relationship', label: 'Relationship Cache', description: 'Rebuild relationship cache only' }
];

export const mockInitialState = {
  isRebuilding: false,
  progress: 0,
  stage: '',
  detail: '',
  error: null,
  selectedCacheType: 'all'
};

export const mockAuthState = {
  isAdmin: true,
  token: 'mock-admin-token'
};