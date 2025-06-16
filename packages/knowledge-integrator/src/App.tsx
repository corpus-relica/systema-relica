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

import { Route } from "react-router-dom";

import { authProvider } from "./authProvider";
import { getSetupStatus, loadUserEnvironment } from "./PortalClient";
import { SetupWizard } from "./pages/Setup";
import { portalSocket } from "./PortalSocket";
import DebugPanel from "./components/DebugPanel";

import CCDataProvider from "./data/CCDataProvider";
import ArchivistDataProvider from "./data/ArchivistDataProvider";

import { useStores } from "./context/RootStoreContext";

import { resolveUIDs } from "./RLCBaseClient";
import { retrieveEnvironment } from "./CCClient";

import { MyLayout } from "./MyLayout";
import Graph from "./pages/Graph";
import Settings from "./pages/Settings";
import Modelling from "./pages/Modelling/";
import Workflows from "./pages/Workflows";
import Dashboard from "./Dashboard";

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
        return (ArchivistDataProvider as any)[name](resource.substring(3), params);
      }
      if (resource.startsWith("env/")) {
        if (name === "getList") {
          return CCDataProvider.getList(resource.substring(4), params);
        } else if (name === "getOne") {
          return CCDataProvider.getOne(resource.substring(4), params);
        }
      }
    };
  },
});

const cats = {
  730044: "Physical Object",
  193671: "Occurrence",
  160170: "Role",
  790229: "Aspect",
  //970002: "Information",
  2850: "Relation",
};

const memStore = localStorageStore();

console.log("vvvv - MEMSTORE vvvv:");
console.log(memStore);

export const App = () => {
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [isCheckingSetup, setIsCheckingSetup] = useState(true);
  const rootStore: any = useStores();

  console.log("vvvv - ROOT STORE vvvv:");
  console.log(rootStore);
  const { factDataStore } = rootStore;

  const { setCategories } = factDataStore;
  // const [isConnected, setIsConnected] = useState(false);

  // const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  // const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);

  const establishCats = async () => {
    const concepts = await resolveUIDs(
      Object.keys(cats).map((x) => parseInt(x))
    );
    console.log("vvvv - CONCEPTS vvvv:");
    console.log(concepts);
    const newCats = [];
    for (const [key, name] of Object.entries(cats)) {
      const concept = concepts.find((c: any) => c.uid === parseInt(key));
      const { uid, descendants } = concept;
      newCats.push({ uid, name, descendants });
    }
    console.log("vvvv - CATEGORIES vvvv:");
    console.log(newCats);
    setCategories(newCats);
  };

  // Check setup status on app startup
  useEffect(() => {
    const checkSetup = async () => {
      try {
        const setupStatus = await getSetupStatus();
        setSetupRequired(setupStatus.setupRequired);
        setIsCheckingSetup(false);
        
        if (!setupStatus.setupRequired) {
          // If setup is complete, initialize the app
          await initializeApp();
        }
      } catch (error) {
        console.error("Failed to check setup status:", error);
        
        // If we can't check setup status, assume setup is required
        // This handles cases where the API is down or auth is needed
        console.log("🔧 Assuming setup is required due to API error");
        setSetupRequired(true);
        setIsCheckingSetup(false);
      }
    };

    checkSetup();
  }, []);

  const initializeApp = async () => {
    try {
      console.log("🚀 Initializing application...");
      
      // Load user environment from Portal
      const userEnv = await loadUserEnvironment();
      console.log("📦 User environment loaded:", userEnv);
      
      // Add facts to store
      if (userEnv.facts) {
        factDataStore.addFacts(userEnv.facts);
      }
      
      // Establish categories
      await establishCats();
      
      console.log("✅ Application ready!");
      
    } catch (error) {
      console.error("❌ Failed to initialize application:", error);
      throw error;
    }
  };

  // Show loading screen while checking setup
  if (isCheckingSetup) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        🔄 Initializing Systema Relica...
      </div>
    );
  }

  // Show setup wizard if setup is required
  if (setupRequired) {
    return <SetupWizard />;
  }

  // Show main application
  return (
    <QueryClientProvider client={queryClient}>
      <Admin
        layout={MyLayout}
        dashboard={Dashboard}
        dataProvider={dataProvider}
        authProvider={authProvider}
        store={memStore}
      >
        <Resource name="db/kinds" list={ListGuesser} />
        <CustomRoutes>
          <Route path="env/graph" element={<Graph />} />
          <Route path="/modelling" element={<Modelling />} />
          <Route path="/workflows" element={<Workflows />} />
          <Route path="/settings" element={<Settings />} />
        </CustomRoutes>
      </Admin>
      
      {/* Debug panel - only show in development */}
      {import.meta.env.DEV && <DebugPanel />}
    </QueryClientProvider>
  );
};
