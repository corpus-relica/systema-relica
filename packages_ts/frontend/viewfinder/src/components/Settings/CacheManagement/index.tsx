import React, { useState, useCallback } from 'react';
import RebuildButton from './RebuildButton.js';
import ProgressIndicator from './ProgressIndicator.js';
import StatusMessages from './StatusMessages.js';
import CacheTypeSelect from './CacheTypeSelect.js';
import { useCacheRebuild } from './hooks/useCacheRebuild.js';

interface CacheRebuildState {
  isRebuilding: boolean;
  progress: number;
  currentPhase: string;
  error: string | null;
  selectedCacheTypes: string[];
  statusMessage: string;
}

const CacheManagementSection = () => {
  const [state, setState] = useState<CacheRebuildState>({
    isRebuilding: false,
    progress: 0,
    currentPhase: '',
    error: null,
    selectedCacheTypes: [],
    statusMessage: '',
  });

  // Handle state updates from WebSocket events
  const handleStateChange = useCallback((updates: Partial<CacheRebuildState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize WebSocket hook
  const { startCacheRebuild, cancelCacheRebuild, isConnected } = useCacheRebuild({
    onStateChange: handleStateChange,
  });

  const handleRebuildStart = () => {
    if (!isConnected()) {
      setState(prev => ({
        ...prev,
        error: 'WebSocket connection not established. Please refresh the page.',
        statusMessage: '',
      }));
      return;
    }

    // Start the cache rebuild via WebSocket
    startCacheRebuild(state.selectedCacheTypes);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Cache Management</h2>
      
      {/* Connection status indicator */}
      {!isConnected() && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
          <strong>Warning:</strong> WebSocket connection not established. Real-time updates may not work.
        </div>
      )}
      
      <div className="space-y-6">
        <CacheTypeSelect
          disabled={state.isRebuilding}
          selectedTypes={state.selectedCacheTypes}
          onSelectionChange={(types: string[]) =>
            setState(prev => ({ ...prev, selectedCacheTypes: types }))
          }
        />
        
        <RebuildButton
          isRebuilding={state.isRebuilding}
          onRebuild={handleRebuildStart}
          disabled={state.isRebuilding || state.selectedCacheTypes.length === 0 || !isConnected()}
        />

        {state.isRebuilding && (
          <>
            <ProgressIndicator
              progress={state.progress}
              phase={state.currentPhase}
            />
            
            {/* Cancel button during rebuild */}
            <button
              onClick={cancelCacheRebuild}
              className="text-sm text-red-600 hover:text-red-800 underline"
            >
              Cancel Rebuild
            </button>
          </>
        )}

        <StatusMessages
          error={state.error}
          message={state.statusMessage}
        />
      </div>
    </div>
  );
};

export default CacheManagementSection;