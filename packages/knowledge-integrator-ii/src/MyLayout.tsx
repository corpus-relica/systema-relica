import { Layout } from "react-admin";

import { MyMenu } from "./MyMenu";

export const MyLayout = (props: any) => <Layout {...props} menu={MyMenu} />;
