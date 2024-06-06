import React, { useRef, useEffect, useContext, useState } from "react";
import { observer } from "mobx-react";
import { Drop, Box, Menu, Text, Layer, Button } from "grommet";
import { ControlledMenu, MenuItem, MenuDivider } from "@szhsin/react-menu";
import { sockSendCC } from "../../socket";

import RootStoreContext from "../../context/RootStoreContext";

import {
  getAllRelatedFacts,
  getSubtypes,
  getSubtypesCone,
  getClassified,
  getSpecializationHierarchy,
} from "../../RLCBaseClient";

interface KindContextMenuProps {
  setUidToDelete: (uid: number) => void;
  setSubtypesModalIsOpen: (isOpen: boolean) => void;
  setPossibleSubtypes: (subtypes: any) => void;
  setExistingSubtypes: (subtypes: any) => void;

  setClassifiedModalIsOpen: (isOpen: boolean) => void;
  setPossibleClassified: (classified: any) => void;
  setExistingClassified: (classified: any) => void;

  setWarnIsOpen: (isOpen: boolean) => void;
}

const KindMenuItems: React.FC<KindContextMenuProps> = observer(
  ({
    setUidToDelete,
    setSubtypesModalIsOpen,
    setPossibleSubtypes,
    setExistingSubtypes,
    setClassifiedModalIsOpen,
    setPossibleClassified,
    setExistingClassified,
    setWarnIsOpen,
  }) => {
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

    const querySubtypes = async () => {
      // sockSendCC("user", "getSubtypes", { uid });
      const subtypes = await getSubtypes(uid);
      const existingSubtypes = subtypes
        .filter((subtype) => {
          const foo = factDataStore.findDefinitiveFacts(subtype.lh_object_uid);
          return (
            factDataStore.findDefinitiveFacts(subtype.lh_object_uid).length > 0
          );
        })
        .map((subtype) => subtype.lh_object_uid);
      setPossibleSubtypes(subtypes);
      setExistingSubtypes(existingSubtypes);
      setSubtypesModalIsOpen(true);
    };

    const querySubtypesCone = async () => {
      sockSendCC("user", "getSubtypesCone", { uid });
      // sockSendCC("user", "getSubtypes", { uid });
      // const subtypes = await getSubtypesCone(uid);
      // const existingSubtypes = subtypes
      //   .filter((subtype) => {
      //     const foo = factDataStore.findDefinitiveFacts(subtype.lh_object_uid);
      //     return (
      //       factDataStore.findDefinitiveFacts(subtype.lh_object_uid).length > 0
      //     );
      //   })
      //   .map((subtype) => subtype.lh_object_uid);
      // setPossibleSubtypes(subtypes);
      // setExistingSubtypes(existingSubtypes);
      // setSubtypesModalIsOpen(true);
      // console.log("WTF??");
    };

    const queryClassified = async () => {
      const classified = await getClassified(uid);
      const existingClassified = classified
        .filter((individual) => {
          const foo = factDataStore.findDefinitiveFacts(
            individual.lh_object_uid,
          );
          return (
            factDataStore.findDefinitiveFacts(individual.lh_object_uid).length >
            0
          );
        })
        .map((individual) => individual.lh_object_uid);
      setPossibleClassified(classified);
      setExistingClassified(existingClassified);
      setClassifiedModalIsOpen(true);
      // const response = await getClassified(uid);
      // addFacts(response);
      console.log("MUTHERFUCK??");
    };

    const removeEntity = () => {
      sockSendCC("user", "removeEntity", { uid });
    };

    const removeEntitySubtypesRecursive = () => {
      sockSendCC("user", "removeEntitySubtypesRecursive", { uid });
    };

    const label = (str, color = "dark-3") => (
      <Box gap="none" margin="none" pad="none">
        <Text size="xsmall" weight="bold" color={color} margin="none">
          {str}
        </Text>
      </Box>
    );

    const handleItemClick = (e) => {
      console.log(`[MenuItem] ${e.value} clicked`);
      switch (e.value) {
        case "SH":
          querySH();
          break;
        case "show classified":
          queryClassified();
          break;
        case "show 'all'":
          queryOmni();
          break;
        case "show subtypes":
          querySubtypes();
          break;
        case "show subtypes cone":
          querySubtypesCone();
          break;
        case "rem this":
          removeEntity();
          break;
        case "rem subtypes(r)":
          removeEntitySubtypesRecursive();
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
      <ControlledMenu
        state={x !== null && y !== null ? "open" : "closed"}
        anchorPoint={{ x, y }}
        onClose={closeContextMenu}
        onItemClick={handleItemClick}
        menuClassName="my-menu"
      >
        <MenuItem value="SH">SH</MenuItem>
        <MenuItem value="show classified">show classified</MenuItem>
        <MenuItem value="show 'all'">show 'all'</MenuItem>
        <MenuItem value="show subtypes">show subtypes</MenuItem>
        <MenuItem value="show subtypes cone">show subtypes cone</MenuItem>
        <MenuDivider />
        <MenuItem value="rem this">rem this</MenuItem>
        <MenuItem value="rem subtypes(r)">rem subtypes(r)</MenuItem>
        <MenuDivider />
        <MenuItem value="delete this!" className={menuItemClassName}>
          delete this!
        </MenuItem>
      </ControlledMenu>
    );
  },
);

export default KindMenuItems;
