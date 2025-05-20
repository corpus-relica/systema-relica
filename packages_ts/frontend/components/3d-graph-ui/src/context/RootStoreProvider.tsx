import React from "react";
import RootStoreContext from "./RootStoreContext.js";
import RootStore from "../stores/RootStore.js";

/**
 * Provider component props
 */
export interface RootStoreProviderProps {
  store: RootStore;
  children: React.ReactNode;
}

/**
 * Provider component for the RootStore
 *
 * This component should be used at the top level of the component tree
 * to provide the RootStore to all child components.
 *
 * @example
 * ```tsx
 * const rootStore = new RootStore();
 *
 * function App() {
 *   return (
 *     <RootStoreProvider store={rootStore}>
 *       <MyComponent />
 *     </RootStoreProvider>
 *   );
 * }
 * ```
 */
export function RootStoreProvider({ store, children }: RootStoreProviderProps) {
  return (
    <RootStoreContext.Provider value={store}>
      {children}
    </RootStoreContext.Provider>
  );
}
