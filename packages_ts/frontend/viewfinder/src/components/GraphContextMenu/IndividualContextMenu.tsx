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

import { sendSocketMessage } from "../../socket";

const SHOW_ALL = "show 'all'";
const REM_THIS = "rem this";
const DELETE_THIS = "delete this!";
const COMPOSITION_OUT = "load composition out";
const CONNECTIONS_OUT = "load connections out";
const COMPOSITION_IN = "load composition in";
const CONNECTIONS_IN = "load connections in";

interface IndividualContextMenuProps {
  uid: number;
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  setUidToDelete: (uid: number) => void;
  setWarnIsOpen: (isOpen: boolean) => void;
}

const IndividualContextMenu: React.FC<IndividualContextMenuProps> = (props) => {
  const {
    uid,
    category,
    open,
    handleClose,
    x,
    y,
    setUidToDelete,
    setWarnIsOpen,
  } = props;

  const handleItemClick = useCallback(
    (e) => {
      const value = e.currentTarget.getAttribute("value");
      console.log(`Clicked item with value: ${value}`);
      switch (value) {
        case SHOW_ALL:
          // sockSendCC("user", "loadAllRelatedFacts", { uid });
          sendSocketMessage("loadAllRelatedFacts", { uid });
          handleClose();
          break;
        case REM_THIS:
          // sockSendCC("user", "unloadEntity", { uid });
          sendSocketMessage("unloadEntity", { uid });
          handleClose();
          break;
        case DELETE_THIS:
          setUidToDelete(uid);
          setWarnIsOpen(true);
          handleClose();
          break;
        case COMPOSITION_OUT:
          // sockSendCC("user", "loadComposition", { uid });
          sendSocketMessage("loadComposition", { uid });
          handleClose();
          break;
        case CONNECTIONS_OUT:
          // sockSendCC("user", "loadConnections", { uid });
          sendSocketMessage("loadConnections", { uid });
          handleClose();
          break;
        case COMPOSITION_IN:
          // sockSendCC("user", "loadComposition", { uid });
          sendSocketMessage("loadCompositionIn", { uid });
          handleClose();
          break;
        case CONNECTIONS_IN:
          // sockSendCC("user", "loadConnections", { uid });
          sendSocketMessage("loadConnectionsIn", { uid });
          handleClose();
          break;
        default:
          console.log(`Unknown value: ${value}`);
      }
    },
    [uid, handleClose]
  );

  const menuItemClassName = ({ hover }) =>
    hover ? "my-menuitem-hover" : "my-menuitem";
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
      <MenuItem value="category" disabled>
        category: {category}
      </MenuItem>
      <Divider />
      <MenuItem value="show classifier" disabled>
        show classifier
      </MenuItem>
      <MenuItem value={SHOW_ALL} onClick={handleItemClick}>
        show 'all'
      </MenuItem>
      <MenuItem value={COMPOSITION_OUT} onClick={handleItemClick}>
        {"load composition ->"}
      </MenuItem>
      <MenuItem value={COMPOSITION_IN} onClick={handleItemClick}>
        {"-> load composition"}
      </MenuItem>
      <MenuItem value={CONNECTIONS_OUT} onClick={handleItemClick}>
        {"load connections ->"}
      </MenuItem>
      <MenuItem value={CONNECTIONS_IN} onClick={handleItemClick}>
        {"-> load connections"}
      </MenuItem>
      <Divider />
      <MenuItem value={REM_THIS} onClick={handleItemClick}>
        rem this
      </MenuItem>
      <MenuItem
        value={DELETE_THIS}
        onClick={handleItemClick}
        className={menuItemClassName}
      >
        delete this!
      </MenuItem>
    </Menu>
  );
};

// <MenuItem onClick={handleItemClick} value="show all facts">
//   Show all facts
// </MenuItem>
// <MenuItem onClick={handleItemClick} value="show all concepts">
//   Show all concepts
// </MenuItem>
// <Divider />
// <MenuItem onClick={handleItemClick} value="delete this!">
//   Delete this!
// </MenuItem>

export default IndividualContextMenu;
