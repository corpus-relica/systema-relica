import { createContext, useContext } from "react";
import RootStore from "../stores/RootStore";

const RootStoreContext = createContext<RootStore | null>(null);

export const useStores = () => {
  const store = useContext(RootStoreContext);
  if (!store) {
    throw new Error("useStores must be used within a RootStoreProvider");
  }
  return store;
};

export default RootStoreContext;
