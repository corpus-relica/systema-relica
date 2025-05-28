import { useEffect, useCallback, useRef } from 'react';
import { portalWs, sendSocketMessage } from '../../../../socket.js';

interface CacheRebuildState {
  isRebuilding: boolean;
  progress: number;
  currentPhase: string;
  error: string | null;
  selectedCacheTypes: string[];
  statusMessage: string;
  isComplete: boolean;  // New flag to track completion state
}

interface UseCacheRebuildOptions {
  onStateChange: (state: Partial<CacheRebuildState>) => void;
}

interface CacheRebuildEventData {
  progress?: number;
  phase?: string;
  message?: string;
  error?: string;
  cacheType?: string;
  totalCaches?: number;
  currentCache?: number;
}

export const useCacheRebuild = ({ onStateChange }: UseCacheRebuildOptions) => {
  // Use refs to maintain stable references for event handlers
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;

  // Handle rebuild start event
  const handleRebuildStart = useCallback((data: CacheRebuildEventData) => {
    console.log('Cache rebuild started:', data);
    onStateChangeRef.current({
      isRebuilding: true,
      progress: 0,
      currentPhase: data.phase || 'Initializing',
      error: null,
      statusMessage: data.message || 'Cache rebuild started...',
    });
  }, []);

  // Handle rebuild progress event
  const handleRebuildProgress = useCallback((d: any) => {
    const { data } = d;
    console.log('Cache rebuild progress:', data);
    
    // Calculate progress based on provided data
    let progress = data.progress || 0;
    
    // If we have cache-specific progress info, calculate overall progress
    if (data.totalCaches && data.currentCache) {
      const cacheProgress = (data.currentCache - 1) / data.totalCaches * 100;
      const currentCacheProgress = (data.progress || 0) / data.totalCaches;
      progress = cacheProgress + currentCacheProgress;
    }
    
    onStateChangeRef.current({
      progress: Math.min(progress, 100),
      currentPhase: data.phase || 'Processing',
      statusMessage: data.message || `Rebuilding cache... ${Math.round(progress)}%`,
    });
  }, []);

  // Handle rebuild complete event
  const handleRebuildComplete = useCallback((data: CacheRebuildEventData) => {
    console.log('Cache rebuild completed:', data);
    onStateChangeRef.current({
      isRebuilding: false,
      progress: 100,
      currentPhase: 'Complete',
      error: null,
      statusMessage: data.message || 'Cache rebuild completed successfully!',
      isComplete: true,
    });
  }, []);

  // New function to handle completion acknowledgment
  const acknowledgeCompletion = useCallback(() => {
    onStateChangeRef.current({
      progress: 0,
      currentPhase: '',
      statusMessage: '',
      isComplete: false,
    });
  }, []);

  // Handle rebuild error event
  const handleRebuildError = useCallback((data: CacheRebuildEventData) => {
    console.error('Cache rebuild error:', data);
    onStateChangeRef.current({
      isRebuilding: false,
      progress: 0,
      currentPhase: 'Error',
      error: data.error || 'An error occurred during cache rebuild',
      statusMessage: '',
    });
  }, []);

  // Set up WebSocket event listeners
  useEffect(() => {
    // Register event handlers
    portalWs.on(':prism.cache/rebuild-start', handleRebuildStart);
    portalWs.on(':prism.cache/rebuild-progress', handleRebuildProgress);
    portalWs.on(':prism.cache/rebuild-complete', handleRebuildComplete);
    portalWs.on(':prism.cache/rebuild-error', handleRebuildError);

    // Cleanup function to remove event listeners
    return () => {
      portalWs.off(':prism.cache/rebuild-start', handleRebuildStart);
      portalWs.off(':prism.cache/rebuild-progress', handleRebuildProgress);
      portalWs.off(':prism.cache/rebuild-complete', handleRebuildComplete);
      portalWs.off(':prism.cache/rebuild-error', handleRebuildError);
    };
  }, [handleRebuildStart, handleRebuildProgress, handleRebuildComplete, handleRebuildError]);

  // Function to initiate cache rebuild
  const startCacheRebuild = useCallback((cacheTypes: string[]) => {
    console.log('Initiating cache rebuild for types:', cacheTypes);
    
    // Send WebSocket message to start rebuild
    sendSocketMessage(':prism.cache/rebuild', {
      cacheTypes: cacheTypes,
      timestamp: new Date().toISOString(),
    });
    
    // Optimistically update UI
    onStateChangeRef.current({
      isRebuilding: true,
      progress: 0,
      currentPhase: 'Initializing',
      error: null,
      statusMessage: 'Sending cache rebuild request...',
    });
  }, []);

  // Function to cancel cache rebuild (if supported by backend)
  const cancelCacheRebuild = useCallback(() => {
    console.log('Cancelling cache rebuild');
    
    sendSocketMessage(':prism.cache/rebuild-cancel', {
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Check WebSocket connection status
  const isConnected = useCallback(() => {
    return portalWs.getClientId() !== null;
  }, []);

  return {
    startCacheRebuild,
    cancelCacheRebuild,
    isConnected,
    acknowledgeCompletion,
  };
};
