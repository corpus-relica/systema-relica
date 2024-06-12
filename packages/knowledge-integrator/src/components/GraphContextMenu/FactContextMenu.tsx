import React, { useContext } from "react";
import { observer } from "mobx-react";
import { ControlledMenu, MenuItem, MenuDivider } from "@szhsin/react-menu";

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
    const { graphViewStore } = useContext(RootStoreContext);

    const { contextMenuFocus, closeContextMenu } = graphViewStore;
    const { x, y, uid } = contextMenuFocus;

    const menuItemClassName = ({ hover }) =>
      hover ? "my-menuitem-hover" : "my-menuitem";

    const handleItemClick = (e) => {
      // console.log(`[MenuItem] ${e.value} clicked`);
      switch (e.value) {
        //   case "Clear All":
        //     // clearStage();
        //     console.log("CLEAR ALL");
        //     sockSendCC("user", "clearEntities", {});
        //     break;
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
          <MenuItem value="Clear All">FOOBARBAZ {uid}</MenuItem>
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
