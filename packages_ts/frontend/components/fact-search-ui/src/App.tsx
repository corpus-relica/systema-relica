import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Fact } from "@relica/types";
import Header from "./Header/index.js";
import Body from "./Body.js";
import RootStoreContext from "./context/RootStoreContext.js";
import rootStore from "./stores/RootStore.js";
// import Box from "@mui/material/Box";
import { initializeAxiosInstance } from "./axiosInstance.js";

import { Box } from "@mui/material";

const queryClient = new QueryClient();

export interface FactTableProps {
  baseUrl?: string;
  callback: (fact: Fact) => void;
  filter?: {
    type: string;
    uid: number;
  };
  initialQuery?: string;
  showModeToggle?: boolean;
  mode?: "search" | "query";
  height?: string | number;
  autoload?: boolean;
  readonly?: boolean;
  token?: string;
}

const FactTable: React.FC<FactTableProps> = ({
  baseUrl,
  callback,
  filter,
  initialQuery = "",
  showModeToggle = false,
  mode = "search",
  height = "100%",
  autoload = false,
  readonly = false,
  token,
}) => {
  React.useEffect(() => {
    if (baseUrl) {
      initializeAxiosInstance(baseUrl, token);
    } else {
      console.warn(
        "FactTable component mounted without a 'baseUrl' prop. API calls may fail."
      );
    }
  }, [baseUrl, token]);

  rootStore.filter = filter;
  rootStore.initialQuery = initialQuery;
  rootStore.mode = mode;
  rootStore.token = token;

  return (
    <RootStoreContext.Provider value={rootStore}>
      <QueryClientProvider client={queryClient}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: height,
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Header
            showModeToggle={showModeToggle}
            readonly={readonly}
            autoload={autoload}
          />
          <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
            <Body callback={callback} />
          </Box>
        </Box>
      </QueryClientProvider>
    </RootStoreContext.Provider>
  );
};

export default FactTable;
