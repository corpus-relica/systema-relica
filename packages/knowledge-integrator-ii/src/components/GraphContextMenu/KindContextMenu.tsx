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

import {
  getAllRelatedFacts,
  getSubtypes,
  getSubtypesCone,
  getClassified,
  getSpecializationHierarchy,
} from "../../RLCBaseClient";

const SH = "SH";
const SHOW_CLASSIFIED = "show classified";
const SHOW_ALL = "show 'all'";
const SHOW_SUBTYPES = "show subtypes";
const SHOW_SUBTYPES_CONE = "show subtypes cone";
const REM_THIS = "rem this";
const REM_SUBTYPES_R = "rem subtypes(r)";
const DELETE_THIS = "delete this!";

interface KindContextMenuProps {
  uid: number;
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  setSubtypesDialogueIsOpen: (isOpen: boolean) => void;
  setPossibleSubtypes: (classified: any) => void;
  setExistingSubtypes: (classified: any) => void;
  setClassifiedDialogueIsOpen: (isOpen: boolean) => void;
  setPossibleClassified: (classified: any) => void;
  setExistingClassified: (classified: any) => void;
  setUidToDelete: (uid: number) => void;
  setWarnIsOpen: (isOpen: boolean) => void;
}

// const handleItemClick = (e) => {
// };

import { useStores } from "../../context/RootStoreContext";

const KindContextMenu: React.FC<KindContextMenuProps> = (props) => {
  const { factDataStore } = useStores();
  const {
    uid,
    open,
    handleClose,
    x,
    y,
    setSubtypesDialogueIsOpen,
    setPossibleSubtypes,
    setExistingSubtypes,
    setClassifiedDialogueIsOpen,
    setPossibleClassified,
    setExistingClassified,
    setUidToDelete,
    setWarnIsOpen,
  } = props;

  const handleItemClick = useCallback(
    async (e) => {
      const value = e.currentTarget.getAttribute("value");
      console.log(`Clicked item with value: ${value}`);
      switch (value) {
        case SH:
          sockSendCC("user", "getSpecializationHierarchy", { uid });
          handleClose();
          break;
        case SHOW_CLASSIFIED:
          const classified = await getClassified(uid);
          const existingClassified = classified
            .filter((individual: any) => {
              const foo = factDataStore.findDefinitiveFacts(
                individual.lh_object_uid
              );
              return (
                factDataStore.findDefinitiveFacts(individual.lh_object_uid)
                  .length > 0
              );
            })
            .map((individual) => individual.lh_object_uid);
          setPossibleClassified(classified);
          setExistingClassified(existingClassified);
          setClassifiedDialogueIsOpen(true);
          // const response = await getClassified(uid);
          // addFacts(response);
          console.log("MUTHERFUCK??");
          handleClose();
          break;
        case SHOW_ALL:
          sockSendCC("user", "getAllRelatedFacts", { uid });
          handleClose();
          break;
        case SHOW_SUBTYPES:
          // sockSendCC("user", "getSubtypes", { uid });
          const subtypes = await getSubtypes(uid);
          const existingSubtypes = subtypes
            .filter((subtype) => {
              const foo = factDataStore.findDefinitiveFacts(
                subtype.lh_object_uid
              );
              return (
                factDataStore.findDefinitiveFacts(subtype.lh_object_uid)
                  .length > 0
              );
            })
            .map((subtype) => subtype.lh_object_uid);
          setPossibleSubtypes(subtypes);
          setExistingSubtypes(existingSubtypes);
          setSubtypesDialogueIsOpen(true);
          handleClose();
          break;
        case SHOW_SUBTYPES_CONE:
          sockSendCC("user", "getSubtypesCone", { uid });
          handleClose();
          break;
        case REM_THIS:
          sockSendCC("user", "removeEntity", { uid });
          handleClose();
          break;
        case REM_SUBTYPES_R:
          sockSendCC("user", "removeEntitySubtypesRecursive", { uid });
          handleClose();
          break;
        case DELETE_THIS:
          setUidToDelete(uid);
          setWarnIsOpen(true);
          handleClose();
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
      <MenuItem value="SH" onClick={handleItemClick}>
        SH
      </MenuItem>
      <MenuItem value={SHOW_CLASSIFIED} onClick={handleItemClick}>
        show classified
      </MenuItem>
      <MenuItem value={SHOW_ALL} onClick={handleItemClick}>
        show 'all'
      </MenuItem>
      <MenuItem value={SHOW_SUBTYPES} onClick={handleItemClick}>
        show subtypes
      </MenuItem>
      <MenuItem value={SHOW_SUBTYPES_CONE} onClick={handleItemClick}>
        show subtypes cone
      </MenuItem>
      <Divider />
      <MenuItem value={REM_THIS} onClick={handleItemClick}>
        rem this
      </MenuItem>
      <MenuItem value={REM_SUBTYPES_R} onClick={handleItemClick}>
        rem subtypes(r)
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

export default KindContextMenu;
