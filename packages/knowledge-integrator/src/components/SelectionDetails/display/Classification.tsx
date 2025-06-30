import React, { useContext } from "react";
import { useStore } from "react-admin";
import RootStoreContext from "../../../context/RootStoreContext";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

import { PortalUserActions } from "@relica/websocket-contracts";
import { portalSocket } from "../../../socket";

interface ClassificationProps {
  uids: number[];
  individualUID: number;
}

const Classification: React.FC<ClassificationProps> = ({
  uids,
  individualUID,
}) => {
  const handleUIDClick = (uid: number) => {
    portalSocket.send(PortalUserActions.LOAD_ENTITY, { uid: uid });
    portalSocket.send(PortalUserActions.LOAD_ENTITY, { uid: individualUID });
  };

  const ui = uids.map((uid, index) => {
    const [model] = useStore("model:" + uid);
    if (model) {
      return <Typography size="xsmall">{model.name}</Typography>;
    } else {
      return (
        <Typography
          size="xsmall"
          color="brand"
          onClick={handleUIDClick.bind(this, uid)}
        >
          {uid}
        </Typography>
      );
    }
  });

  return (
    <Stack direction="column" align="start">
      {ui}
    </Stack>
  );
};

export default Classification;
