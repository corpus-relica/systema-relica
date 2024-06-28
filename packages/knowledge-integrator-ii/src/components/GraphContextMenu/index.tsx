import React, { useEffect, useState } from "react";
import KindContextMenu from "./KindContextMenu";

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

  console.log("GRAPH CONTEXT MENU ?????", open);

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
                open={open}
                handleClose={handleClose}
                x={x}
                y={y}
              />
            );
          } else if (model.type === "individual") {
            // menu = <div>Individual</div>;
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

  return <>{menu}</>;
};

export default GraphContextMenu;
