import React, { useRef, useEffect, useContext, useState } from "react";
import { Drop, Box, Menu, Text, Layer, Button } from "grommet";
//@ts-ignore
import { SUBTYPES_ENDPOINT, CLASSIFIED_ENDPOINT } from "@relica/constants";
import { observer } from "mobx-react";
import RootStoreContext from "../../context/RootStoreContext";
import { sockSendCC } from "../../socket";

import { ControlledMenu, MenuItem, MenuDivider } from "@szhsin/react-menu";
import "@szhsin/react-menu/dist/index.css";

import "./style.css";

import KindContextMenu from "./KindContextMenu";
import IndividualContextMenu from "./IndividualContextMenu";
import StageContextMenu from "./StageContextMenu";

import SubtypesModal from "../SubtypesModal";
import ClassifiedModal from "./ClassifiedModal";

interface GraphContextMenuProps {}

const GraphContextMenu: React.FC<GraphContextMenuProps> = observer(() => {
  const [subtypesModalIsOpen, setSubtypesModalIsOpen] = useState(false);
  const [possibleSubtypes, setPossibleSubtypes] = useState([]);
  const [existingSubtypes, setExistingSubtypes] = useState([]);

  const [classifiedModalIsOpen, setClassifiedModalIsOpen] = useState(false);
  const [possibleClassified, setPossibleClassified] = useState([]);
  const [existingClassified, setExistingClassified] = useState([]);

  const [warnIsOpen, setWarnIsOpen] = useState(false);
  const [uidToDelete, setUidToDelete] = useState(null);

  const { graphViewStore, factDataStore, entityDataStore, semanticModelStore } =
    useContext(RootStoreContext);

  const { addFacts, addConcepts } = factDataStore;
  const { contextMenuFocus, closeContextMenu } = graphViewStore;
  const { x, y, uid } = contextMenuFocus;

  let menu;
  if (uid) {
    const model = semanticModelStore.models.get(uid);
    if (model.type === "kind") {
      menu = (
        <KindContextMenu
          setUidToDelete={setUidToDelete}
          setSubtypesModalIsOpen={setSubtypesModalIsOpen}
          setPossibleSubtypes={setPossibleSubtypes}
          setExistingSubtypes={setExistingSubtypes}
          setClassifiedModalIsOpen={setClassifiedModalIsOpen}
          setPossibleClassified={setPossibleClassified}
          setExistingClassified={setExistingClassified}
          setWarnIsOpen={setWarnIsOpen}
        />
      );
    } else if (model.type === "individual") {
      menu = (
        <IndividualContextMenu
          setUidToDelete={setUidToDelete}
          setWarnIsOpen={setWarnIsOpen}
        />
      );
    } else {
      console.log("unknown model type: ", model.type);
    }
  } else if (x && y) {
    // assume we opened context menu over the 'stage'
    menu = <StageContextMenu />;
  } else {
    // context menu is not open
    menu = null;
  }
  const dropTargetRef = useRef(null);

  useEffect(() => {
    // Reposition the drop target
    if (dropTargetRef.current) {
      dropTargetRef.current.style.left = `${x}px`;
      dropTargetRef.current.style.top = `${y}px`;
    }
  }, [x, y, dropTargetRef]);

  const deleteEntity = () => {
    const uid = uidToDelete;
    setUidToDelete(null);
    sockSendCC("user", "deleteEntity", { uid });
    setWarnIsOpen(false);
  };

  return (
    <>
      <div
        ref={dropTargetRef}
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 1,
          backgroundColor: "red",
          zIndex: 1000,
        }}
      ></div>
      {menu}

      {warnIsOpen && (
        <Layer>
          <Box gap="medium" margin="medium">
            <Text>Are you sure you want to delete this entity?</Text>
            <Box direction="row-reverse" gap="small">
              <Button
                label="Yes!"
                onClick={deleteEntity.bind(this)}
                color="status-critical"
              />
              <Button
                label="No"
                onClick={() => setWarnIsOpen(false)}
                color="status-ok"
              />
            </Box>
          </Box>
        </Layer>
      )}

      {subtypesModalIsOpen && (
        <SubtypesModal
          uid={uid}
          subtypes={possibleSubtypes}
          existingSubtypes={existingSubtypes}
          handleClose={() => {
            setSubtypesModalIsOpen(false);
          }}
          handleOk={(selected: number[], notSelected: number[]) => {
            setSubtypesModalIsOpen(false);
            console.log(selected, notSelected);
            sockSendCC("user", "loadEntities", { uids: selected });
            sockSendCC("user", "removeEntities", { uids: notSelected });
          }}
        />
      )}

      {classifiedModalIsOpen && (
        <ClassifiedModal
          uid={uid}
          classified={possibleClassified}
          existingSubtypes={existingClassified}
          handleClose={() => {
            setClassifiedModalIsOpen(false);
          }}
          handleOk={(selected: number[], notSelected: number[]) => {
            setClassifiedModalIsOpen(false);
            sockSendCC("user", "loadEntities", { uids: selected });
            sockSendCC("user", "removeEntities", { uids: notSelected });
          }}
        />
      )}
    </>
  );
});

export default GraphContextMenu;
