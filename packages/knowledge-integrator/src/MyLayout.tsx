import { Layout } from "react-admin";

import { MyMenu } from "./MyMenu";
import { MyAppBar } from "./MyAppBar";

export const MyLayout = (props: any) => (
  <Layout {...props} appBar={MyAppBar} menu={MyMenu} />
);
