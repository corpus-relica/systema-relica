import React, {
  useRef,
  useEffect,
  useContext,
  useState,
  useCallback,
} from "react";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import SearchIcon from "@mui/icons-material/Search";

import { sockSendCC, sendSocketMessage } from "../../socket";

const CLEAR_ALL = "Clear all";
const SEARCH = "Search";

const CLEAR_ENVIRONMENT_ENTITIES = "clearEnvironmentEntities";

interface IndividualContextMenuProps {
  // uid: number;
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  // setUidToDelete: (uid: number) => void;
  // setWarnIsOpen: (isOpen: boolean) => void;
  setSearchUIOpen: (isOpen: boolean) => void;
}

const StageContextMenu: React.FC<IndividualContextMenuProps> = (props) => {
  const {
    // uid,
    open,
    handleClose,
    x,
    y,
    // setUidToDelete, setWarnIsOpen
    setSearchUIOpen,
  } = props;

  const handleItemClick = (e) => {
    const value = e.currentTarget.getAttribute("value");
    switch (value) {
      case CLEAR_ALL:
        // sockSendCC("user", "clearEntities", {});
        sendSocketMessage(CLEAR_ENVIRONMENT_ENTITIES, {});
        handleClose();
        break;
      case SEARCH:
        setSearchUIOpen(true);
        handleClose();
        break;
      default:
        console.log("DEFAULT");
        break;
    }
  };

  return (
    <Menu
      open={open}
      onClose={handleClose}
      transitionDuration={0}
      anchorReference="anchorPosition"
      anchorPosition={{ top: y, left: x }}
      MenuListProps={{
        "aria-labelledby": "basic-button",
        style: { pointerEvents: "auto" },
      }}
      PaperProps={{
        style: { pointerEvents: "auto" },
      }}
      BackdropProps={{
        style: { pointerEvents: "none" },
      }}
      style={{ pointerEvents: "none" }}
    >
      <MenuItem value={SEARCH} onClick={handleItemClick}>
        <ListItemIcon>
          <SearchIcon />
        </ListItemIcon>
        <ListItemText>Search</ListItemText>
      </MenuItem>
      <Divider />
      <MenuItem value={CLEAR_ALL} onClick={handleItemClick}>
        Clear all
      </MenuItem>
    </Menu>
  );
};

export default StageContextMenu;
