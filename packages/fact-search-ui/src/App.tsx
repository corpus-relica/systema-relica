import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Box,
  Button,
  //@ts-ignore
  Data,
  DataTable,
  Grommet,
} from "grommet";
//@ts-ignore
import { Fact } from "@relica/types";
//@ts-ignore
import Header from "./Header";
import Body from "./Body";
import RootStoreContext from "./context/RootStoreContext";
import rootStore from "./stores/RootStore";

const queryClient = new QueryClient();

const ALL = "All";

interface FactTableProps {
  callback: (fact: Fact) => void;
  filter?: {
    type: string;
    uid: number;
  };
  initialQuery?: string;
}

const theme = {
  global: {
    font: {
      family: "Jura",
      size: "18px",
      height: "20px",
    },
  },
};

const FactTable: React.FC<FactTableProps> = ({
  callback,
  filter,
  initialQuery = "",
}) => {
  rootStore.filter = filter;
  rootStore.initialQuery = initialQuery;
  return (
    <RootStoreContext.Provider value={rootStore}>
      <QueryClientProvider client={queryClient}>
        <Grommet theme={theme}>
          <Box pad="medium" gap="small" width="xlarge" height="large">
            <Header />
            <Body callback={callback} />
          </Box>
        </Grommet>
      </QueryClientProvider>
    </RootStoreContext.Provider>
  );
};

export default FactTable;
