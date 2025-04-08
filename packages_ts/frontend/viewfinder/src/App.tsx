import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";

import React, { useEffect, useState, useContext } from "react";
import {
  Admin,
  Resource,
  ListGuesser,
  EditGuesser,
  ShowGuesser,
  CustomRoutes,
  combineDataProviders,
  defaultDataProvider,
  localStorageStore,
  useStore,
  useStoreContext,
} from "react-admin";

import { Route, BrowserRouter, Routes } from "react-router-dom";

import { authProvider, isSetupNeeded } from "./providers/AuthProvider.js";

import EnvDataProvider from "./providers/EnvDataProvider.js";
import FactsDataProvider from "./providers/FactsDatProvider.js";

import ArchivistDataProvider from "./providers/ArchivistDataProvider.js";

import { useStores } from "./context/RootStoreContext.js";

import { resolveUIDs } from "./io/ArchivistBaseClient.js";

import { retrieveEnvironment } from "./io/CCBaseClient.js";

import { MyLayout } from "./MyLayout.js";
import MyLoginPage from "./MyLoginPage.js";
import Graph from "./pages/Graph.js";
import Settings from "./pages/Settings.js";
import Modelling from "./pages/Modelling/index.js";
import Workflows from "./pages/Workflows/index.js";
import Dashboard from "./Dashboard.js";
import SetupWizard from "./pages/Setup";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const dataProvider = new Proxy(defaultDataProvider, {
  get: (target, name) => {
    return (resource: any, params: any) => {
      console.log("GETTING", resource, name);
      // TODO: why the fuck would name === "then"?
      if (typeof name === "symbol" || name === "then") {
        return;
      }
      if (resource.startsWith("db/")) {
        return (FactsDataProvider as any)[name](resource.substring(3), params);
      }
      if (resource.startsWith("env/")) {
        if (name === "getList") {
          return EnvDataProvider.getList(resource.substring(4), params);
        } else if (name === "getOne") {
          return EnvDataProvider.getOne(resource.substring(4), params);
        }
      }
    };
  },
});

const memStore = localStorageStore();

console.log("vvvv - MEMSTORE vvvv:");
console.log(memStore);

// Main App with conditional rendering based on setup needs
export const App = () => {
  const rootStore: any = useStores();
  const { factDataStore } = rootStore;
  const { setCategories } = factDataStore;
  
  // Check if we need to show the setup wizard
  const [showSetup, setShowSetup] = useState(false);
  
  // Effect to check setup status on mount
  useEffect(() => {
    // If auth provider already checked and determined setup is needed
    setShowSetup(isSetupNeeded());
  }, []);
  
  console.log('APP STARTUP', { showSetup });
  
  // If setup is needed, show the setup wizard outside of Admin
  if (showSetup) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<SetupWizard />} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Otherwise, show the normal admin interface
  return (
    <QueryClientProvider client={queryClient}>
      <Admin
        layout={MyLayout}
        loginPage={MyLoginPage}
        dashboard={Dashboard}
        dataProvider={dataProvider}
        authProvider={authProvider}
        store={memStore}
        disableTelemetry
      >
        <Resource name="db/kinds" list={ListGuesser} />
        <CustomRoutes>
          <Route path="env/graph" element={<Graph />} />
          {/*<Route path="/modelling" element={<Modelling />} />
          <Route path="/workflows" element={<Workflows />} />*/}
          <Route path="/settings" element={<Settings />} />
          <Route path="/setup" element={<SetupWizard />} />
        </CustomRoutes>
      </Admin>
    </QueryClientProvider>
  );
};
