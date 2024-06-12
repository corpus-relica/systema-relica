import React, { useContext } from "react";
import { observer } from "mobx-react";
import { ControlledMenu, MenuItem, MenuDivider } from "@szhsin/react-menu";
import { Fact } from "../../types";
import { sockSendCC } from "../../socket";

import RootStoreContext from "../../context/RootStoreContext";

import {
  getAllRelatedFacts,
  getSubtypes,
  getClassified,
  getSpecializationHierarchy,
} from "../../RLCBaseClient";

interface FactContextMenuProps {
  setUidToDelete: (uid: number) => void;
  setWarnIsOpen: (isOpen: boolean) => void;
}

const FactMenuItems: React.FC<FactContextMenuProps> = observer(
  ({ setUidToDelete, setWarnIsOpen }) => {
    const { graphViewStore, factDataStore } = useContext(RootStoreContext);

    const { contextMenuFocus, closeContextMenu } = graphViewStore;
    const { x, y, uid } = contextMenuFocus;
    const fact: Fact = factDataStore.findFact(uid);

    const menuItemClassName = ({ hover }) =>
      hover ? "my-menuitem-hover" : "my-menuitem";

    const handleItemClick = (e) => {
      // console.log(`[MenuItem] ${e.value} clicked`);
      switch (e.value) {
        case "delete this!":
          setUidToDelete(uid);
          setWarnIsOpen(true);
          break;
        case "rem this":
          sockSendCC("user", "removeFact", { uid });
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
          <MenuItem value="---">
            Fact {uid} :: {fact.rel_type_uid} : {fact.rel_type_name}
          </MenuItem>
          <MenuDivider />
          <MenuItem value="rem this">rem this</MenuItem>
          <MenuDivider />
          <MenuItem value="delete this!" className={menuItemClassName}>
            delete this!
          </MenuItem>
        </ControlledMenu>
      </>
    );
  },
);

export default FactMenuItems;
