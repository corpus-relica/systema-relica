import React, { useContext } from "react";
import { useStore } from "react-admin";
import Stack from "@mui/material/Stack";
import { sockSendCC } from "../../../socket";
import Typography from "@mui/material/Typography";

interface PossibleRoleProps {
  uid: number; // specify the correct type instead of any if possible
  roleplayerUID: number;
}

const PossibleRole: React.FC<PossibleRoleProps> = ({ uid, roleplayerUID }) => {
  const [model] = useStore("model:" + uid);

  const handleUIDClick = (uid: number) => {
    sockSendCC("user", "loadEntity", { uid: uid });
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
