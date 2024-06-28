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
} from "react-admin";
import { Route } from "react-router-dom";

import { authProvider } from "./authProvider";

import CCDataProvider from "./data/CCDataProvider";
import ArchivistDataProvider from "./data/ArchivistDataProvider";

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

export const App = () => {
  useEffect(() => {
    const onConnect = () => {
      // setIsConnected(true);
      console.log("//// CONNECTED SOCKET> CC");
    };

    const onDisconnect = () => {
      // setIsConnected(false);
      console.log("//// DISCONNECTED SOCKET> CC");
    };

    const onSelectEntity = (d) => {
      console.log("SELECT ENTITY");
      console.log(typeof d.uid);
      // graphViewStore.selectedNode = d.uid;
      // graphViewStore.selectedEdge = null;
    };

    const onSelectFact = (d) => {
      console.log("SELECT FACT");
      console.log(typeof d.uid);
      // graphViewStore.selectedEdge = d.uid;
      // graphViewStore.selectedNode = null;
    };

    const onAddFacts = (d) => {
      console.log(d);
      // factDataStore.addFacts(d.facts);
      // semanticModelStore.addModels(d.models);
    };

    const onRemFacts = (d) => {
      // factDataStore.removeFacts(d.fact_uids);
      // semanticModelStore.models.forEach((model) => {
      //   if (!factDataStore.hasObject(model.uid))
      //     semanticModelStore.removeModel(model.uid);
      // });
    };

    const onEntitiesCleared = () => {
      // factDataStore.clearFacts();
      // semanticModelStore.clearModels();
      // graphViewStore.selectedNode = null;
    };

    const onNoneSelected = () => {
      // graphViewStore.selectedNode = null;
      // graphViewStore.selectedEdge = null;
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
