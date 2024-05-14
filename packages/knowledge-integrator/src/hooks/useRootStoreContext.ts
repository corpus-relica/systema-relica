import { useContext } from "react";
import RootStoreContext from "../context/RootStoreContext";
import { RootStore } from "../stores/RootStore";

const useRootStoreContext = (): RootStore => {
  const context = useContext(RootStoreContext);
  if (!context) {
    throw new Error(
      "useRootStoreContext must be used within a RootStoreContext.Provider"
    );
  }
  return context;
};

export default useRootStoreContext;
