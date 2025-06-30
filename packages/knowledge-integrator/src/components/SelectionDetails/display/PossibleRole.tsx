import React, { useContext } from "react";
import { useStore } from "react-admin";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { PortalUserActions } from "@relica/websocket-contracts";
import { portalSocket } from "../../../socket";

interface PossibleRoleProps {
  uid: number; // specify the correct type instead of any if possible
  roleplayerUID: number;
}

const PossibleRole: React.FC<PossibleRoleProps> = ({ uid, roleplayerUID }) => {
  const [model] = useStore("model:" + uid);

  const handleUIDClick = (uid: number) => {
    portalSocket.send(PortalUserActions.LOAD_ENTITY, { uid: uid });
  };

  let ui;
  if (model) {
    ui = <Typography size="xsmall">{model.name}</Typography>;
  } else {
    return (ui = (
      <Typography
        size="xsmall"
        color="brand"
        onClick={handleUIDClick.bind(this, uid)}
      >
        {uid}
      </Typography>
    ));
  }

  return (
    <Stack direction="column" align="start">
      {ui}
    </Stack>
  );
};

export default PossibleRole;
