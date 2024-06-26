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
        return CCDataProvider.getList(resource.substring(4), params);
      }
    };
  },
});

export const App = () => (
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
