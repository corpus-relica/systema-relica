import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Fact } from "@relica/types";
import Header from "./Header";
import Body from "./Body";
import RootStoreContext from "./context/RootStoreContext";
import rootStore from "./stores/RootStore";
import Box from "@mui/material/Box";

const queryClient = new QueryClient();

interface FactTableProps {
  callback: (fact: Fact) => void;
  filter?: {
    type: string;
    uid: number;
  };
  initialQuery?: string;
  showModeToggle?: boolean;
  mode?: "search" | "query";
  height?: string | number;
}

const FactTable: React.FC<FactTableProps> = ({
  callback,
  filter,
  initialQuery = "",
  showModeToggle = false,
  mode = "search",
  height = "100%",
}) => {
  rootStore.filter = filter;
  rootStore.initialQuery = initialQuery;
  rootStore.mode = mode;

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
          <Header showModeToggle={showModeToggle} />
          <Box sx={{ flexGrow: 1, overflow: "auto", minHeight: 0 }}>
            <Body callback={callback} />
          </Box>
        </Box>
      </QueryClientProvider>
    </RootStoreContext.Provider>
  );
};

export default FactTable;
