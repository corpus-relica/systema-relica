import React, { useContext } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { sockSendCC, sendSocketMessage } from "../../../socket";

interface ValueProps {
  value: { quant: number; uom: { uid: number; name: string } };
}

const Value: React.FC<ValueProps> = ({ value }) => {
  const performRequest = async () => {
    sendSocketMessage("loadSpecializationHierarchy", { uid: value.uom.uid });
  };

  return (
    <Stack direction="row" align="start">
      <Typography>{value.quant}</Typography>
      <Typography color="brand" onClick={performRequest}>
        {value.uom.name}
      </Typography>
    </Stack>
  );
};

export default Value;
