import { useStores } from "../context/RootStoreContext.js";

/**
 * Hook to access the root store
 *
 * @returns The root store instance
 * @throws Error if used outside of a RootStoreProvider
 */
export function useRootStore() {
  return useStores();
}

/**
 * Hook to access the graph data store
 *
 * @returns The graph data store instance
 */
export function useGraphDataStore() {
  const rootStore = useRootStore();
  return rootStore.graphDataStore;
}

/**
 * Hook to access the UI state store
 *
 * @returns The UI state store instance
 */
export function useUIStateStore() {
  const rootStore = useRootStore();
  return rootStore.uiStateStore;
}

/**
 * Hook to access the physics store
 *
 * @returns The physics store instance
 */
export function usePhysicsStore() {
  const rootStore = useRootStore();
  return rootStore.physicsStore;
}

// Re-export useStores for backward compatibility
export { useStores };
