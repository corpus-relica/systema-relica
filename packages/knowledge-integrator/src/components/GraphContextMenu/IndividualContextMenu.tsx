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

import { portalSocket } from "../../socket";
import { PortalUserActions } from "@relica/websocket-contracts";
import { useStores } from "../../context/RootStoreContext";

const SHOW_ALL = "show 'all'";
const REM_THIS = "rem this";
const DELETE_THIS = "delete this!";

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

  const rootStore = useStores();
  const { authStore } = rootStore;

  const handleItemClick = useCallback(
    (e) => {
      const value = e.currentTarget.getAttribute("value");
      console.log(`Clicked item with value: ${value}`);
      switch (value) {
        case SHOW_ALL: {
          const userId = authStore.userId;
          const environmentId = rootStore.environmentId;
          portalSocket.send(PortalUserActions.LOAD_ALL_RELATED_FACTS, {
            userId,
            environmentId,
            uid,
          });
          handleClose();
          break;
        }
        case REM_THIS: {
          const userId = authStore.userId;
          const environmentId = rootStore.environmentId;
          portalSocket.send(PortalUserActions.UNLOAD_ENTITIES, {
            userId,
            environmentId,
            uid,
          });
          handleClose();
          break;
        }
        case DELETE_THIS:
          setUidToDelete(uid);
          setWarnIsOpen(true);
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
