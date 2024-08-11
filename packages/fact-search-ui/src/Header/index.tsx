import React, { useState } from "react";
import { observer } from "mobx-react-lite";
import { useStores } from "../context/RootStoreContext";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import SearchMode from "./SearchMode";
import QueryMode from "./QueryMode";

interface HeaderProps {
  showModeToggle?: boolean;
}

const Header: React.FC<HeaderProps> = observer(({ showModeToggle = false }) => {
  const rootStore = useStores();
  const [isQueryMode, setIsQueryMode] = useState(false);

  const handleModeToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsQueryMode(event.target.checked);
  };

  return (
    <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
      <Grid container spacing={2} alignItems="center">
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
        {isQueryMode ? <QueryMode /> : <SearchMode />}
      </Grid>
    </Box>
  );
});

export default Header;
