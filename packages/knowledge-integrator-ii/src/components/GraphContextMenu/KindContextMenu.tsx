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

interface KindContextMenuProps {
  uid: number;
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  // uid: number;
  // type: string;
}

// const handleItemClick = (e) => {
// };

const KindContextMenu: React.FC<KindContextMenuProps> = (props) => {
  const { uid, open, handleClose, x, y } = props;

  const handleItemClick = useCallback(
    (e) => {
      const value = e.currentTarget.getAttribute("value");
      console.log(`Clicked item with value: ${value}`);
      switch (value) {
        case "SH":
          sockSendCC("user", "getSpecializationHierarchy", { uid });
          handleClose();
          break;
        case "show classified":
          // queryClassified();
          break;
        case "show 'all'":
          // queryOmni();
          break;
        case "show subtypes":
          // querySubtypes();
          break;
        case "show subtypes cone":
          // querySubtypesCone();
          break;
        case "rem this":
          // removeEntity();
          break;
        case "rem subtypes(r)":
          // removeEntitySubtypesRecursive();
          break;
        case "delete this!":
          // setUidToDelete(uid);
          // setWarnIsOpen(true);
          break;

        default:
          console.log("DEFAULT");
          break;
      }
    },
    [uid]
  );

  const menuItemClassName = ({ hover }) =>
    hover ? "my-menuitem-hover" : "my-menuitem";

  console.log("KIND CONTEXT MENU ?????", open);
  return (
    <Menu
      open={open}
      onClose={handleClose}
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
      <MenuItem value="SH" onClick={handleItemClick}>
        SH
      </MenuItem>
      <MenuItem value="show classified">show classified</MenuItem>
      <MenuItem value="show 'all'">show 'all'</MenuItem>
      <MenuItem value="show subtypes">show subtypes</MenuItem>
      <MenuItem value="show subtypes cone">show subtypes cone</MenuItem>
      <Divider />
      <MenuItem value="rem this">rem this</MenuItem>
      <MenuItem value="rem subtypes(r)">rem subtypes(r)</MenuItem>
      <Divider />
      <MenuItem value="delete this!" className={menuItemClassName}>
        delete this!
      </MenuItem>
    </Menu>
  );
};

export default KindContextMenu;
