import React, { useState } from 'react';
import RebuildButton from './RebuildButton.js';
import ProgressIndicator from './ProgressIndicator.js';
import StatusMessages from './StatusMessages.js';
import CacheTypeSelect from './CacheTypeSelect.js';

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

  const handleRebuildStart = () => {
    setState(prev => ({
      ...prev,
      isRebuilding: true,
      progress: 0,
      error: null,
      statusMessage: 'Starting cache rebuild...',
    }));
    // WebSocket handler will be implemented later
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Cache Management</h2>
      <div className="space-y-6">
        <CacheTypeSelect
          disabled={state.isRebuilding}
          selectedTypes={state.selectedCacheTypes}
          onSelectionChange={(types) => 
            setState(prev => ({ ...prev, selectedCacheTypes: types }))
          }
        />
        
        <RebuildButton
          isRebuilding={state.isRebuilding}
          onRebuild={handleRebuildStart}
          disabled={state.isRebuilding || state.selectedCacheTypes.length === 0}
        />

        {state.isRebuilding && (
          <ProgressIndicator
            progress={state.progress}
            phase={state.currentPhase}
          />
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