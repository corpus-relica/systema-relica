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

interface KindContextMenuProps {}

const KindMenuItems: React.FC<KindContextMenuProps> = observer(() => {
  const [uidToDelete, setUidToDelete] = useState(null);

  const { graphViewStore, factDataStore } = useContext(RootStoreContext);

  const { findDefinitiveFacts, removeFact } = factDataStore;

  const { contextMenuFocus, closeContextMenu } = graphViewStore;
  const { x, y, uid } = contextMenuFocus;

  const menuItemClassName = ({ hover }) =>
    hover ? "my-menuitem-hover" : "my-menuitem";

  const querySH = async () => {
    sockSendCC("user", "getSpecializationHierarchy", { uid });
  };

  const handleItemClick = (e) => {
    console.log(`[MenuItem] ${e.value} clicked`);
    switch (e.value) {
      case "Clear All":
        // clearStage();

        console.log("CLEAR ALL");
        sockSendCC("user", "clearEntities", {});
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
        <MenuItem value="Clear All">Clear all</MenuItem>
      </ControlledMenu>
    </>
  );
});

export default KindMenuItems;
