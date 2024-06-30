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

import CCDataProvider from "./data/CCDataProvider";
import ArchivistDataProvider from "./data/ArchivistDataProvider";

import { useStores } from "./context/RootStoreContext";

import { resolveUIDs } from "./RLCBaseClient";
import { retrieveEnvironment } from "./CCClient";

import { MyLayout } from "./MyLayout";
import Graph from "./pages/Graph";
import Modelling from "./pages/Modelling/";
import Dashboard from "./Dashboard";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ccSocket } from "./socket";

const queryClient = new QueryClient();

const dataProvider = new Proxy(defaultDataProvider, {
  get: (target, name) => {
    return (resource: any, params: any) => {
      console.log("GETTING", resource, name);
      if (typeof name === "symbol" || name === "then") {
        return;
      }
      if (resource.startsWith("db/")) {
        return ArchivistDataProvider[name](resource.substring(3), params);
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

export const App = () => {
  const foo = useStoreContext();
  console.log("vvvv - STORE CONTEXT vvvv:");
  console.log(foo);
  const rootStore: any = useStores();
  console.log("vvvv - ROOT STORE vvvv:");
  console.log(rootStore);
  const { factDataStore } = rootStore;
  const { addFacts, addConcepts, setCategories } = factDataStore;
  const [isConnected, setIsConnected] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const [selectedNode, setSelectedNode] = useStore("selectedNode", null);
  const [selectedEdge, setSelectedEdge] = useStore("selectedEdge", null);

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

  useEffect(() => {
    const retrieveEnv = async () => {
      const env = await retrieveEnvironment();
      console.log("vvvv - ENVIRONMENT vvvv:");
      console.log(env);
      factDataStore.addFacts(env.facts);
      // semanticModelStore.addModels(env.models);
      // graphViewStore.selectedNode = env.selectedEntity;
    };

    const foobarbaz = async () => {
      await establishCats();
      await retrieveEnv();
      console.log("NOW WE'RE READY!!!!!!!!!!!!!!!!");
      setIsReady(true);
    };

    foobarbaz();
  }, []);

  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log("//// CONNECTED SOCKET> CC");
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log("//// DISCONNECTED SOCKET> CC");
    };

    const onSelectEntity = (d) => {
      console.log("SELECT ENTITY");
      console.log(d.uid);
      memStore.setItem("selectedNode", d.uid); //
      memStore.setItem("selectedEdge", null);
    };

    const onSelectFact = (d) => {
      console.log("SELECT FACT");
      console.log(d.uid);
      memStore.setItem("selectedNode", null);
      memStore.setItem("selectedEdge", d.uid);
    };

    const onAddFacts = (d) => {
      console.log(d);
      factDataStore.addFacts(d.facts);
      // semanticModelStore.addModels(d.models);
    };

    const onRemFacts = (d) => {
      factDataStore.removeFacts(d.fact_uids);
      // semanticModelStore.models.forEach((model) => {
      //   if (!factDataStore.hasObject(model.uid))
      //     semanticModelStore.removeModel(model.uid);
      // });
    };

    const onEntitiesCleared = () => {
      factDataStore.clearFacts();
      // semanticModelStore.clearModels();
      memStore.setItem("selectedNode", null);
    };

    const onNoneSelected = () => {
      memStore.setItem("selectedNode", null);
      memStore.setItem("selectedEdge", null);
    };

    ccSocket.on("connect", onConnect);
    ccSocket.on("disconnect", onDisconnect);

    ccSocket.on("system:selectEntity", onSelectEntity);
    ccSocket.on("system:selectFact", onSelectFact);
    ccSocket.on("system:selectedNone", onNoneSelected);
    ccSocket.on("system:addFacts", onAddFacts);
    ccSocket.on("system:remFacts", onRemFacts);
    // ccSocket.on("system:updateCategoryDescendantsCache", establishCats);
    ccSocket.on("system:entitiesCleared", onEntitiesCleared);

    return () => {
      ccSocket.off("connect", onConnect);
      ccSocket.off("disconnect", onDisconnect);

      ccSocket.off("system:selectEntity", onSelectEntity);
      ccSocket.off("system:selectFact", onSelectFact);
      ccSocket.off("system:addFacts", onAddFacts);
      ccSocket.off("system:remFacts", onRemFacts);
      // ccSocket.off("system:updateCategoryDescendantsCache", establishCats);
    };
  }, []);

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
        </CustomRoutes>
      </Admin>
    </QueryClientProvider>
  );
};
