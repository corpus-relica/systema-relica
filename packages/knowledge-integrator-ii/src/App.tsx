import {
  Admin,
  Resource,
  ListGuesser,
  EditGuesser,
  ShowGuesser,
  CustomRoutes,
} from "react-admin";
import { Route } from "react-router-dom";

import { dataProvider } from "./dataProvider";
import { authProvider } from "./authProvider";

import { MyLayout } from "./MyLayout";
import Graph from "./Graph";
import Dashboard from "./Dashboard";

export const App = () => (
  <Admin
    layout={MyLayout}
    dashboard={Dashboard}
    dataProvider={dataProvider}
    authProvider={authProvider}
  >
    <Resource name="kinds" list={ListGuesser} />
    <CustomRoutes>
      <Route path="/graph" element={<Graph />} />
    </CustomRoutes>
  </Admin>
);