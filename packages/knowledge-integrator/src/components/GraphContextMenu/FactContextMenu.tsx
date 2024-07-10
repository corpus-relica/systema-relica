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

import { sockSendCC } from "../../socket";

const CLEAR_ALL = "Clear all";
const REM_THIS = "rem this";
const DELETE_THIS = "delete this!";

interface IndividualContextMenuProps {
  // uid: number;
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  // setUidToDelete: (uid: number) => void;
  // setWarnIsOpen: (isOpen: boolean) => void;
}

const StageContextMenu: React.FC<IndividualContextMenuProps> = (props) => {
  const {
    // uid,
    open,
    handleClose,
    x,
    y,
    // setUidToDelete, setWarnIsOpen
  } = props;

  const handleItemClick = (e) => {
    const value = e.currentTarget.getAttribute("value");
    switch (value) {
      case CLEAR_ALL:
        console.log("CLEAR ALL");
        sockSendCC("user", "clearEntities", {});
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
        disabled
      >
        delete this!
      </MenuItem>
    </Menu>
  );
};

export default StageContextMenu;
