import { Layout } from "react-admin";

import { MyMenu } from "./MyMenu";
import { MyAppBar } from "./MyAppBar";

import XTerminal from "./xterm";
import LispREPL from "./lispREPL";

export const MyLayout = (props: any) => (
  <Layout {...props} appBar={MyAppBar} menu={MyMenu}>
    {props.children}
    <LispREPL />
  </Layout>
);
