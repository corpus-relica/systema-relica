import { createContext, useContext } from "react";
import RootStore from "../stores/RootStore.js";

/**
 * React context for providing the RootStore to components
 */
const RootStoreContext = createContext<RootStore | null>(null);

/**
 * Legacy hook to access the root store
 *
 * This hook is maintained for backward compatibility with existing components.
 * New components should use the more specific hooks in useStores.js.
 *
 * @returns The root store instance with all its properties
 * @throws Error if used outside of a RootStoreProvider
 */
export const useStores = () => {
  const store = useContext(RootStoreContext);
  if (!store) {
    throw new Error("useStores must be used within a RootStoreProvider");
  }
  return store;
};

export default RootStoreContext;
