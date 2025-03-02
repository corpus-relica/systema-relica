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

import KindContextPhysicalObjectSubmenu from "./submenu/PhsysicalObject";
import KindContextAspectSubmenu from "./submenu/Aspect";
import KindContextRoleSubmenu from "./submenu/Role";
import KindContextRelationSubmenu from "./submenu/Relation";
import KindContextOccurrenceSubmenu from "./submenu/Occurrence";

import { sockSendCC,
         sendSocketMessage} from "../../../socket";

import {
  getAllRelatedFacts,
  getSubtypes,
  getSubtypesCone,
  getClassified,
  getSpecializationHierarchy,
} from "../../../io/ArchivistBaseClient.js";

import { useStores } from "../../../context/RootStoreContext";
import { Fact } from "../../../types";

const ADD_PARENT = "add parent";
const RE_PARENT = "reparent";
const LOAD_SH = "load SH";
const LOAD_CLASSIFIED = "load classified";
const LOAD_ALL_RELATED = "load all related";
const LOAD_SUBTYPES = "load subtypes";
const LOAD_SUBTYPES_CONE = "load subtypes cone";
const UNLOAD_THIS = "unload this";
const UNLOAD_SUBTYPES_CONE = "unload subtypes cone";
const DELETE_THIS = "delete this!";

interface KindContextMenuProps {
  uid: number;
  category: string;
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

const KindContextMenu: React.FC<KindContextMenuProps> = (props) => {
  const { factDataStore } = useStores();
  const {
    uid,
    category,
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
    async (e: any) => {
      const value = e.currentTarget.getAttribute("value");
      switch (value) {
        case LOAD_SH:
          sendSocketMessage("loadSpecializationHierarchy", { uid });
          handleClose();
          break;
        case LOAD_CLASSIFIED:
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
            .map((individual: Fact) => individual.lh_object_uid);
          setPossibleClassified(classified);
          setExistingClassified(existingClassified);
          setClassifiedDialogueIsOpen(true);
          handleClose();
          break;
        case LOAD_ALL_RELATED:
          sendSocketMessage("loadAllRelatedFacts", { uid });
          handleClose();
          break;
        case LOAD_SUBTYPES:
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
        case LOAD_SUBTYPES_CONE:
          sendSocketMessage("loadSubtypesCone", { uid });
          handleClose();
          break;
        case UNLOAD_THIS:
          sendSocketMessage("unloadEntity", { uid });
          handleClose();
          break;
        case UNLOAD_SUBTYPES_CONE:
          sendSocketMessage("unloadSubtypesCone", { uid });
          handleClose();
          break;
        case DELETE_THIS:
          setUidToDelete(uid);
          setWarnIsOpen(true);
          handleClose();
          break;
        case ADD_PARENT:
          console.log("ADD_PARENT");
          break;
        case RE_PARENT:
          console.log("RE_PARENT");
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

  let submenu: any = null;
  switch (category) {
    case "physical object":
      submenu = (
        <>
          <KindContextPhysicalObjectSubmenu />
          <Divider />
        </>
      );
      break;
    case "aspect":
      submenu = (
        <>
          <KindContextAspectSubmenu />
          <Divider />
        </>
      );
      break;
    case "role":
      submenu = (
        <>
          <KindContextRoleSubmenu />
          <Divider />
        </>
      );
      break;
    case "relation":
      submenu = (
        <>
          <KindContextRelationSubmenu />
          <Divider />
        </>
      );
      break;
    case "occurrence":
      submenu = (
        <>
          <KindContextOccurrenceSubmenu />
          <Divider />
        </>
      );
      break;
  }

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
      {submenu}
      <MenuItem value={LOAD_SH} onClick={handleItemClick}>
        SH
      </MenuItem>
      <MenuItem value={LOAD_CLASSIFIED} onClick={handleItemClick}>
        load classified
      </MenuItem>
      <MenuItem value={LOAD_ALL_RELATED} onClick={handleItemClick}>
        load all related
      </MenuItem>
      <MenuItem value={LOAD_SUBTYPES} onClick={handleItemClick}>
        load subtypes
      </MenuItem>
      <MenuItem value={LOAD_SUBTYPES_CONE} onClick={handleItemClick}>
        load subtypes cone
      </MenuItem>
      <Divider />
      <MenuItem value={ADD_PARENT} disabled>
        add parent
      </MenuItem>
      <MenuItem value={RE_PARENT} disabled>
        reparent
      </MenuItem>
      <Divider />
      <MenuItem value={UNLOAD_THIS} onClick={handleItemClick}>
        unoad this
      </MenuItem>
      <MenuItem value={UNLOAD_SUBTYPES_CONE} onClick={handleItemClick}>
        unload subtypes cone
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
