import React, { useEffect, useState } from "react";
import KindContextMenu from "./KindContextMenu";
import IndividualContextMenu from "./IndividualContextMenu";
import StageContextMenu from "./StageContextMenu";
import FactContextMenu from "./FactContextMenu";
import ClassifiedDialogue from "./ClassifiedDialogue";
import SubtypesDialogue from "./SubtypesDialogue";
import DeleteEntityDialogue from "./DeleteEntityDialogue";
import DeleteFactDialogue from "./DeleteFactDialogue";
import { portalSocket } from "../../PortalSocket";
import { getEntityType, getEntityCategory } from "../../RLCBaseClient";
import { useStores } from "../../context/RootStoreContext";

interface GraphContextMenuProps {
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  uid: number;
  type: string;
  relType?: number;
  setSearchUIOpen: (isOpen: boolean) => void;
}

import { useStore, useDataProvider } from "react-admin";

const GraphContextMenu: React.FC<GraphContextMenuProps> = (props) => {
  const dataProvider = useDataProvider();
  const rootStore = useStores();
  const { authStore } = rootStore;
  const { open, handleClose, x, y, uid, type, relType, setSearchUIOpen } =
    props;
  const [menu, setMenu] = useState<JSX.Element | null>(null);

  const [subtypesDialogueIsOpen, setSubtypesDialogueIsOpen] = useState(false);
  const [possibleSubtypes, setPossibleSubtypes] = useState([]);
  const [existingSubtypes, setExistingSubtypes] = useState([]);

  const [classifiedDialogueIsOpen, setClassifiedDialogueIsOpen] =
    useState(false);
  const [possibleClassified, setPossibleClassified] = useState([]);
  const [existingClassified, setExistingClassified] = useState([]);

  const [warnIsOpen, setWarnIsOpen] = useState(false);
  const [uidToDelete, setUidToDelete] = useState(null);

  const [factWarnIsOpen, setFactWarnIsOpen] = useState(false);
  const [factUidToDelete, setFactUidToDelete] = useState(null);

  useEffect(() => {
    const foo = async () => {
      if (uid) {
        if (type === "entity") {
          const kind = await getEntityType(uid);
          const category = await getEntityCategory(uid);

          console.log("KIND: ", kind, "CATEGORY: ", category);
          // this isn't even a bad idea...
          // the model will have been computed and loaded by clarity
          // before here...re-implment when clarity is ready.
          // const result = await dataProvider.getOne("env/", {
          //   uid: uid,
          // });
          // const model = result.data;
          if (kind === "kind") {
            // console.log("KIND CONTEXT MENU", model);
            setMenu(
              <KindContextMenu
                uid={uid}
                category={category}
                open={open}
                handleClose={handleClose}
                x={x}
                y={y}
                setSubtypesDialogueIsOpen={setSubtypesDialogueIsOpen}
                setPossibleSubtypes={setPossibleSubtypes}
                setExistingSubtypes={setExistingSubtypes}
                setClassifiedDialogueIsOpen={setClassifiedDialogueIsOpen}
                setPossibleClassified={setPossibleClassified}
                setExistingClassified={setExistingClassified}
                setUidToDelete={setUidToDelete}
                setWarnIsOpen={setWarnIsOpen}
              />
            );
          } else if (kind === "individual") {
            // console.log("KIND INDIVIDUAL MENU", model);
            setMenu(
              <IndividualContextMenu
                uid={uid}
                category={model.category}
                open={open}
                handleClose={handleClose}
                x={x}
                y={y}
                setUidToDelete={setUidToDelete}
                setWarnIsOpen={setWarnIsOpen}
              />
            );
          } else if (kind === "qualification") {
            // menu = <div>Qualification</div>;
          } else {
            console.log("unknown model type: ", kind);
          }
        } else if (type === "fact") {
          setMenu(
            <FactContextMenu
              uid={uid}
              open={open}
              handleClose={handleClose}
              x={x}
              y={y}
              setUidToDelete={setFactUidToDelete}
              setWarnIsOpen={setFactWarnIsOpen}
              relType={relType || 0}
            />
          );
        }
      } else if (x !== null && y !== null) {
        setMenu(
          <StageContextMenu
            x={x}
            y={y}
            open={open}
            handleClose={handleClose}
            setSearchUIOpen={setSearchUIOpen}
          />
        );
      }
    };

    foo();
  }, [uid, open]);

  return (
    <>
      {menu}

      {warnIsOpen && (
        <DeleteEntityDialogue
          uid={uidToDelete}
          handleClose={() => {
            setWarnIsOpen(false);
          }}
          handleOk={() => {
            setWarnIsOpen(false);
            const userId = authStore.userId;
            const environmentId = rootStore.environmentId;
            portalSocket.emit("user", "deleteEntity", {
              userId,
              environmentId,
              uid: uidToDelete,
            });
          }}
        />
      )}

      {factWarnIsOpen && (
        <DeleteFactDialogue
          uid={factUidToDelete}
          handleClose={() => {
            setFactWarnIsOpen(false);
          }}
          handleOk={() => {
            setFactWarnIsOpen(false);
            const userId = authStore.userId;
            const environmentId = rootStore.environmentId;
            portalSocket.emit("user", "deleteFact", {
              userId,
              environmentId,
              uid: factUidToDelete,
            });
          }}
        />
      )}

      {subtypesDialogueIsOpen && (
        <SubtypesDialogue
          uid={uid}
          subtypes={possibleSubtypes}
          existingSubtypes={existingSubtypes}
          handleClose={() => {
            setSubtypesDialogueIsOpen(false);
          }}
          handleOk={(selected: number[], notSelected: number[]) => {
            setSubtypesDialogueIsOpen(false);
            const userId = authStore.userId;
            const environmentId = rootStore.environmentId;
            portalSocket.emit("user", "loadEntities", {
              userId,
              environmentId,
              uids: selected,
            });
            portalSocket.emit("user", "unloadEntities", {
              userId,
              environmentId,
              uids: notSelected,
            });
          }}
        />
      )}

      {classifiedDialogueIsOpen && (
        <ClassifiedDialogue
          uid={uid}
          classified={possibleClassified}
          existingSubtypes={existingClassified}
          handleClose={() => {
            setClassifiedDialogueIsOpen(false);
          }}
          handleOk={(selected: number[], notSelected: number[]) => {
            setClassifiedDialogueIsOpen(false);
            const userId = authStore.userId;
            const environmentId = rootStore.environmentId;
            portalSocket.emit("user", "loadEntities", {
              userId,
              environmentId,
              uids: selected,
            });
            portalSocket.emit("user", "unloadEntities", {
              userId,
              environmentId,
              uids: notSelected,
            });
          }}
        />
      )}
    </>
  );
};

export default GraphContextMenu;
