import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.js";
import "./style.css";

import RootStoreContext from "./context/RootStoreContext";
import rootStore from "./stores/RootStore";

// Set dark mode on app initialization
document.documentElement.classList.add('dark');

ReactDOM.createRoot(document.getElementById("root")!).render(
  <RootStoreContext.Provider value={rootStore}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </RootStoreContext.Provider>
);
