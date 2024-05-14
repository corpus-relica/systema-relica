import React, { useRef, useEffect, useContext, useState } from "react";
import { observer } from "mobx-react";
import { Drop, Box, Menu, Text, Layer, Button } from "grommet";
import { ControlledMenu, MenuItem, MenuDivider } from "@szhsin/react-menu";
import { sockSendCC } from "../../socket";

import SubtypesModal from "../SubtypesModal";
import ClassifiedModal from "./ClassifiedModal";

import RootStoreContext from "../../context/RootStoreContext";

import {
  getAllRelatedFacts,
  getSubtypes,
  getClassified,
  getSpecializationHierarchy,
} from "../../RLCBaseClient";

interface IndividualContextMenuProps {
  setUidToDelete: (uid: number) => void;
  setWarnIsOpen: (isOpen: boolean) => void;
}

const IndividualContextMenu: React.FC<IndividualContextMenuProps> = observer(
  ({ setUidToDelete, setWarnIsOpen }) => {
    const { graphViewStore, factDataStore } = useContext(RootStoreContext);

    const { findDefinitiveFacts, removeFact } = factDataStore;

    const { contextMenuFocus, closeContextMenu } = graphViewStore;
    const { x, y, uid } = contextMenuFocus;

    const menuItemClassName = ({ hover }) =>
      hover ? "my-menuitem-hover" : "my-menuitem";

    const querySH = async () => {
      sockSendCC("user", "getSpecializationHierarchy", { uid });
    };

    const queryOmni = async () => {
      sockSendCC("user", "getAllRelatedFacts", { uid });
    };

    const removeEntity = () => {
      sockSendCC("user", "removeEntity", { uid });
    };

    const handleItemClick = (e) => {
      console.log(`[MenuItem] ${e.value} clicked`);
      switch (e.value) {
        case "show 'all'":
          console.log("SHOW ALL");
          queryOmni();
          break;
        case "rem this":
          removeEntity();
          break;
        case "delete this!":
          setUidToDelete(uid);
          setWarnIsOpen(true);
          break;
        default:
          console.log("DEFAULT");
          break;
      }
    };

    return (
      <>
        <ControlledMenu
          state={x !== null && y !== null ? "open" : "closed"}
          anchorPoint={{ x, y }}
          onClose={closeContextMenu}
          onItemClick={handleItemClick}
          menuClassName="my-menu"
        >
          <MenuItem value="show classifier" disabled>
            show classifier
          </MenuItem>
          <MenuItem value="show 'all'">show 'all'</MenuItem>
          <MenuDivider />
          <MenuItem value="rem this">rem this</MenuItem>
          <MenuItem value="delete this!" className={menuItemClassName}>
            delete this!
          </MenuItem>
        </ControlledMenu>
      </>
    );
  },
);

export default IndividualContextMenu;
