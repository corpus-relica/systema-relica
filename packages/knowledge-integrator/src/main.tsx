import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import RootStoreContext from "./context/RootStoreContext";
import rootStore from "./stores/RootStore";

// import './index.css'
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <RootStoreContext.Provider value={rootStore}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </RootStoreContext.Provider>,
);
