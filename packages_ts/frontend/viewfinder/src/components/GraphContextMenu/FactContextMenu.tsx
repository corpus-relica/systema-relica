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

const CLEAR_ALL = "Clear all";
const REM_THIS = "rem this";
const DELETE_THIS = "delete this!";
const REIFY = "reify";

interface IndividualContextMenuProps {
  uid: number;
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  setUidToDelete: (uid: number) => void;
  setWarnIsOpen: (isOpen: boolean) => void;
  relType: number;
}

const FactContextMenu: React.FC<IndividualContextMenuProps> = (props) => {
  const {
    uid,
    open,
    handleClose,
    x,
    y,
    setUidToDelete,
    setWarnIsOpen,
    relType,
  } = props;
  console.log("Fact context menu opened for uid:", uid);

  const handleItemClick = (e) => {
    const value = e.currentTarget.getAttribute("value");
    switch (value) {
      case CLEAR_ALL:
        console.log("CLEAR ALL");
        sendSocketMessage("clearEnvironmentEntities", {});
        handleClose();
        break;
      case DELETE_THIS:
        setUidToDelete(uid);
        setWarnIsOpen(true);
        handleClose();
        break;
      case REIFY:
        console.log("Reifying relation type:", relType);
        sendSocketMessage("loadSpecializationHierarchy", { uid: relType });
        sendSocketMessage("selectEntity", { uid: relType });
        handleClose();
        break;
      default:
        console.log("DEFAULT");
        break;
    }
  };

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
      <MenuItem value={REIFY} onClick={handleItemClick}>
        reify
      </MenuItem>
      <MenuItem value={CLEAR_ALL} onClick={handleItemClick} disabled>
        intercalate
      </MenuItem>
      <MenuItem value={REM_THIS} onClick={handleItemClick} disabled>
        rem this
      </MenuItem>
      <Divider />
      <MenuItem
        value={DELETE_THIS}
        className={menuItemClassName}
        onClick={handleItemClick}
      >
        delete this!
      </MenuItem>
    </Menu>
  );
};

export default FactContextMenu;
