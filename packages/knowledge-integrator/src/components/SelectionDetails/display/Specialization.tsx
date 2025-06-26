import React, { useContext } from "react";
// import { FormDown, FormNext } from "grommet-icons";
// import { Box, Button, Text } from "grommet";
// import { observer } from "mobx-react";
// import RootStoreContext from "../../../context/RootStoreContext";
import { toJS } from "mobx";
import { useStore } from "react-admin";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { portalSocket } from "../../../PortalSocket";

interface SpecializationProps {
  uids: number[]; // specify the correct type instead of any if possible
  childUID: number;
}

const Specialization: React.FC<SpecializationProps> = ({ uids, childUID }) => {
  console.log("SPECIALIZATION");

  const handleUIDClick = (uid: number) => {
    portalSocket.emit("user", "loadEntity", { uid: uid });
    portalSocket.emit("user", "loadEntity", { uid: childUID });
  };

  const ui = uids.map((uid, index) => {
    const [model] = useStore("model:" + uids[0]);
    console.log(model);
    if (model) {
      return <Typography variant="h6">{model.name}</Typography>;
    } else {
      return (
        <Typography
          variant="h6"
          sx={{ cursor: "pointer" }}
          onClick={handleUIDClick.bind(this, uid)}
        >
          {uid}
        </Typography>
      );
    }
  });

  return (
    <Stack direction="column" style={{ color: "red" }}>
      {ui}
    </Stack>
  );
};

export default Specialization;
