import React, { useContext } from "react";
import { useStore } from "react-admin";
import RootStoreContext from "../../../context/RootStoreContext";
import { sockSendCC } from "../../../socket";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";

interface ClassificationProps {
  uids: number[];
  individualUID: number;
}

const Classification: React.FC<ClassificationProps> = ({
  uids,
  individualUID,
}) => {
  const handleUIDClick = (uid: number) => {
    sockSendCC("user", "loadEntity", { uid: uid });
    sockSendCC("user", "loadEntity", { uid: individualUID });
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
