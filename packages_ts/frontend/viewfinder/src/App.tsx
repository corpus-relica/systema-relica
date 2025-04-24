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

import { authProvider } from "./providers/AuthProvider.js";

import EnvDataProvider from "./providers/EnvDataProvider.js";
import FactsDataProvider from "./providers/FactsDatProvider.js";

import ArchivistDataProvider from "./providers/ArchivistDataProvider.js";

import { useStores } from "./context/RootStoreContext.js";

import { resolveUIDs } from "./io/ArchivistBaseClient.js";
import { retrieveEnvironment } from "./io/CCBaseClient.js";
import { portalClient } from "./io/PortalClient.js";
import { initializeWebSocket, portalWs } from "./socket.js";

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
  
  // State for setup status
  const [setupStatus, setSetupStatus] = useState<'loading' | 'needed' | 'complete' | 'error'>('loading');
  const [setupState, setSetupState] = useState<any>(null);
  
  // Effect to initialize WebSocket and check setup status
  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        // Try to get token for guest access during setup
        let token;
        try {
          // For setup, we use a special guest token from Shutter that doesn't require authentication
          const shutterUrl = import.meta.env.VITE_SHUTTER_URL || "http://localhost:2173";
          const guestAuthResponse = await fetch(
            `${shutterUrl}/api/guest-auth`,
            { 
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
          
          if (guestAuthResponse.ok) {
            const authData = await guestAuthResponse.json();
            token = authData.token;
            console.log("Got guest auth token for setup");
          } else {
            console.warn("Guest auth response not OK:", guestAuthResponse.status);
          }
        } catch (err) {
          console.warn("Failed to get guest token, proceeding without WebSocket:", err);
        }
        
        // Initialize WebSocket if we have a token
        if (token) {
          try {
            await initializeWebSocket(token);
            console.log("WebSocket initialized for setup");
          } catch (wsErr) {
            console.warn("WebSocket initialization failed:", wsErr);
          }
        }
        
        // Check setup status directly through Portal REST API
        const status = await portalClient.getSetupStatus();
        
        if (status.state.id !== 'setup_complete') {
          setSetupStatus('needed');
          setSetupState(status);
        } else {
          setSetupStatus('complete');
        }
      } catch (err) {
        console.error("Failed to check setup status:", err);
        // Going to error state rather than assuming complete
        setSetupStatus('error');
      }
    };
    
    checkSetupStatus();
    
    // Cleanup function
    return () => {
      // We don't completely close WebSocket here as it may be needed after setup
    };
  }, []);
  
  console.log('APP STARTUP', { setupStatus });
  
  // Loading state while checking setup
  if (setupStatus === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Checking system status...</div>
      </div>
    );
  }
  
  // If setup is needed, show the setup wizard outside of Admin
  if (setupStatus === 'needed') {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<SetupWizard initialState={setupState}/>} />
        </Routes>
      </BrowserRouter>
    );
  }

  // Show error/lockout screen if we couldn't connect to the setup services
  if (setupStatus === 'error') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        padding: '0 20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          maxWidth: '500px',
          padding: '30px',
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          backgroundColor: 'white'
        }}>
          <h1 style={{ color: '#d32f2f', marginBottom: '16px' }}>System Setup Error</h1>
          <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '24px' }}>
            We couldn't connect to the necessary system components to check or perform setup. This may be because:
          </p>
          <ul style={{ textAlign: 'left', marginBottom: '24px' }}>
            <li>The backend services are not running</li>
            <li>There's a network connectivity issue</li>
            <li>The system configuration is incorrect</li>
          </ul>
          <p style={{ fontSize: '16px', lineHeight: '1.5', marginBottom: '24px' }}>
            Please contact your system administrator or try refreshing the page.
          </p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#1976d2',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Refresh Page
          </button>
        </div>
      </div>
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
