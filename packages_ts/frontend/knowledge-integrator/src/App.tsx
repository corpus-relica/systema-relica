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

import { authProvider } from "./providers/AuthProvider.js";

import EnvDataProvider from "./providers/EnvDataProvider.js";
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
        return (ArchivistDataProvider as any)[name](
          resource.substring(3),
          params
        );
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
  const rootStore: any = useStores();

  // console.log("vvvv - ROOT STORE vvvv:");
  // console.log(rootStore);
  const { factDataStore } = rootStore;

  const { setCategories } = factDataStore;
  // const [isConnected, setIsConnected] = useState(false);

  // const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  // const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);

  // const establishCats = async () => {
  //   const concepts = await resolveUIDs(
  //     Object.keys(cats).map((x) => parseInt(x))
  //   );
  //   console.log("vvvv - CONCEPTS vvvv:");
  //   console.log(concepts);
  //   const newCats = [];
  //   for (const [key, name] of Object.entries(cats)) {
  //     const concept = concepts.find((c: any) => c.uid === parseInt(key));
  //     const { uid, descendants } = concept;
  //     newCats.push({ uid, name, descendants });
  //   }
  //   console.log("vvvv - CATEGORIES vvvv:");
  //   console.log(newCats);
  //   setCategories(newCats);
  // };

  // useEffect(() => {
  //   const retrieveEnv = async () => {
  //     const foo = await authProvider.getIdentity();

  //     console.log("vvvv - MUTHERFUCKING IDENTITY vvvv:");
  //     console.log(foo);

  //     const env = await retrieveEnvironment();
  //     console.log("vvvv - ENVIRONMENT foo vvvv:");
  //     console.log(env);
  //     factDataStore.addFacts(env.facts);
  //     // semanticModelStore.addModels(env.models);
  //     // graphViewStore.selectedNode = env.selectedEntity;
  //   };

  //   const foobarbaz = async () => {
  //     // await establishCats();
  //     await retrieveEnv();
  //     console.log("NOW WE'RE READY!!!!!!!!!!!!!!!!");
  //   };

  //   foobarbaz();
  // }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Admin
        layout={MyLayout}
        loginPage={MyLoginPage}
        dashboard={Dashboard}
        dataProvider={dataProvider}
        authProvider={authProvider}
        store={memStore}
      >
        <Resource name="db/kinds" list={ListGuesser} />
        <CustomRoutes>
          <Route path="env/graph" element={<Graph />} />
          {/*<Route path="/modelling" element={<Modelling />} />
          <Route path="/workflows" element={<Workflows />} />*/}
          <Route path="/settings" element={<Settings />} />
        </CustomRoutes>
      </Admin>
    </QueryClientProvider>
  );
};
