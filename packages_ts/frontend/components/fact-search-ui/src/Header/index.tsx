import React, { useState, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../context/RootStoreContext.js";
// import Box from "@mui/material/Box";
// import Grid from "@mui/material/Grid";
// import Typography from "@mui/material/Typography";
// import FormControlLabel from "@mui/material/FormControlLabel";
// import Switch from "@mui/material/Switch";
import SearchMode from "./SearchMode.js";
import QueryMode from "./QueryMode.js";
import QueryResultsDisplay from "./QueryResultsDisplay.js";
import { Box, Grid, Typography, Switch, FormControlLabel } from "@mui/material";

interface HeaderProps {
  showModeToggle?: boolean;
  readonly?: boolean;
  autoload?: boolean;
}

const Header: React.FC<HeaderProps> = observer(
  ({ showModeToggle = false, readonly = false, autoload = false }) => {
    const rootStore = useStores();
    const { mode } = rootStore;
    const [isQueryMode, setIsQueryMode] = useState(false);

    useEffect(() => {
      if (mode === "query") {
        setIsQueryMode(true);
      } else {
        setIsQueryMode(false);
      }
    }, [mode]);

    const handleModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
      // setIsQueryMode(event.target.checked);
      rootStore.mode = event.target.checked ? "query" : "search";
      rootStore.facts = [];
      rootStore.queryResult = null;
    };

    return (
      <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
        <Grid container spacing={2} alignItems="flex-start">
          {rootStore.filter && (
            <Grid item xs={12}>
              <Typography>
                Filter: {rootStore.filter.type} : {rootStore.filter.uid}
              </Typography>
            </Grid>
          )}
          {showModeToggle && (
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isQueryMode}
                    onChange={handleModeToggle}
                    name="modeToggle"
                  />
                }
                label={isQueryMode ? "Query Mode" : "Search Mode"}
              />
            </Grid>
          )}
          {isQueryMode ? (
            <Grid container item xs={12} spacing={2}>
              <Grid item xs={8}>
                <QueryMode readonly={readonly} autoload={autoload} />
              </Grid>
              <Grid item xs={4} sx={{ height: "160px" }}>
                {" "}
                {/* Adjust height to match your query textfield */}
                <QueryResultsDisplay />
              </Grid>
            </Grid>
          ) : (
            <SearchMode />
          )}
        </Grid>
      </Box>
    );
  }
);

export default Header;
