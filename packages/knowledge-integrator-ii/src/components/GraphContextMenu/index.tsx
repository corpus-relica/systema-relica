import React, { useEffect, useState } from "react";
import KindContextMenu from "./KindContextMenu";
import IndividualContextMenu from "./IndividualContextMenu";
import ClassifiedDialogue from "./ClassifiedDialogue";
import { sockSendCC } from "../../socket";

interface GraphContextMenuProps {
  open: boolean;
  handleClose: () => void;
  x: number;
  y: number;
  uid: number;
  type: string;
}

import { useStore, useDataProvider } from "react-admin";

const GraphContextMenu: React.FC<GraphContextMenuProps> = (props) => {
  const dataProvider = useDataProvider();
  const { open, handleClose, x, y, uid, type } = props;
  const [menu, setMenu] = useState<JSX.Element | null>(null);

  const [classifiedModalIsOpen, setClassifiedDialogueIsOpen] = useState(false);
  const [possibleClassified, setPossibleClassified] = useState([]);
  const [existingClassified, setExistingClassified] = useState([]);

  useEffect(() => {
    const foo = async () => {
      if (uid) {
        if (type === "entity") {
          const result = await dataProvider.getOne("env/", {
            uid: uid,
          });
          const model = result.data;
          console.log("model: ", model.type);
          if (model.type === "kind") {
            setMenu(
              <KindContextMenu
                uid={uid}
                open={open}
                handleClose={handleClose}
                x={x}
                y={y}
                setClassifiedModalIsOpen={setClassifiedDialogueIsOpen}
                setPossibleClassified={setPossibleClassified}
                setExistingClassified={setExistingClassified}
              />
            );
          } else if (model.type === "individual") {
            setMenu(
              <IndividualContextMenu
                uid={uid}
                open={open}
                handleClose={handleClose}
                x={x}
                y={y}
              />
            );
          } else if (model.type === "qualification") {
            // menu = <div>Qualification</div>;
          } else {
            console.log("unknown model type: ", model.type);
          }
        }
      }
    };

    foo();
  }, [uid, open]);

  return (
    <>
      {menu}

      {classifiedModalIsOpen && (
        <ClassifiedDialogue
          uid={uid}
          classified={possibleClassified}
          existingSubtypes={existingClassified}
          handleClose={() => {
            setClassifiedDialogueIsOpen(false);
          }}
          handleOk={(selected: number[], notSelected: number[]) => {
            setClassifiedDialogueIsOpen(false);
            console.log("selected: ", selected);
            console.log("notSelected: ", notSelected);
            sockSendCC("user", "loadEntities", { uids: selected });
            sockSendCC("user", "removeEntities", { uids: notSelected });
          }}
        />
      )}
    </>
  );
};

export default GraphContextMenu;
