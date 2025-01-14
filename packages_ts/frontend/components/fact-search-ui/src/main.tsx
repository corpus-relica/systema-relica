import React from "react";
import ReactDOM from "react-dom/client";
import FactTable from "./App.js";
import { Fact } from "@relica/types";
import { Box } from "@mui/material";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Box sx={{ height: "100vh", width: "100vw" }}>
      <FactTable
        callback={(f: Fact) => {
          console.log("callback", f);
        }}
        showModeToggle={true}
        readonly={true}
        autoload={true}
        height="100%"
        mode="query"
      />
    </Box>
  </React.StrictMode>
);
