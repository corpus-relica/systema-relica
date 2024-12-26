import { AppBar, TitlePortal } from "react-admin";
import { Link as RouterLink } from "react-router-dom";
import { Link } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import { IconButton } from "@mui/material";

const SettingsButton = () => (
  <Link component={RouterLink} to="/settings">
    <IconButton color="inherit">
      <SettingsIcon />
    </IconButton>
  </Link>
);

export const MyAppBar = () => (
  <AppBar>
    <TitlePortal />
    <SettingsButton />
  </AppBar>
);
