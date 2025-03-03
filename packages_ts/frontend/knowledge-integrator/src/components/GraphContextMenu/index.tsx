import React, { useEffect, useState } from "react";
import KindContextMenu from "./KindContextMenu";
import IndividualContextMenu from "./IndividualContextMenu";
import StageContextMenu from "./StageContextMenu";
import FactContextMenu from "./FactContextMenu";
import ClassifiedDialogue from "./ClassifiedDialogue";
import SubtypesDialogue from "./SubtypesDialogue";
import DeleteEntityDialogue from "./DeleteEntityDialogue";
import DeleteFactDialogue from "./DeleteFactDialogue";
import { portalSocket } from "../../socket";

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
          const result = await dataProvider.getOne("env/", {
            uid: uid,
          });
          const model = result.data;
          if (model.type === "kind") {
            setMenu(
              <KindContextMenu
                uid={uid}
                category={model.category}
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
          } else if (model.type === "individual") {
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
          } else if (model.type === "qualification") {
            // menu = <div>Qualification</div>;
          } else {
            console.log("unknown model type: ", model.type);
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

            portalSocket.sendSocketMessage("deleteEntity", { uid: uidToDelete });
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

            portalSocket.sendSocketMessage("deleteFact", { uid });
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

            portalSocket.sendSocketMessage("loadEntities", { uids: selected });
            portalSocket.sendSocketMessage("unloadEntities", { uids: notSelected });

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

            portalSocket.sendSocketMessage("loadEntities", { uids: selected });
            portalSocket.sendSocketMessage("unloadEntities", { uids: notSelected });

          }}
        />
      )}
    </>
  );
};

export default GraphContextMenu;
