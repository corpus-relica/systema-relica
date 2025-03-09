import React from "react";
import { sockSendCC } from "../../../socket";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useQuery } from "@tanstack/react-query";
import { portalClient } from "../../../io/PortalClient.js";

interface ClassificationProps {
  uids: number[];
  individualUID: number;
}

const Classification: React.FC<ClassificationProps> = ({
  uids,
  individualUID,
}) => {
  console.log("CLASSIFICATION", uids, individualUID);

  // Query for all UIDs in the array
  const modelsQuery = useQuery({
    queryKey: ["kindModels", uids],
    queryFn: () =>
      uids && uids.length > 0
        ? Promise.all(
            uids.map((uid) =>
              portalClient.retrieveKindModel(uid).then((res) => ({
                uid,
                ...res
              }))
            )
          )
        : Promise.resolve([]),
    enabled: !!uids && uids.length > 0
  });

  const handleUIDClick = (uid: number) => {
    sockSendCC("user", "loadEntity", { uid: uid });
    sockSendCC("user", "loadEntity", { uid: individualUID });
  };

  if (modelsQuery.isLoading) return <Typography>Loading...</Typography>;
  if (modelsQuery.error) return <Typography color="error">Error loading models</Typography>;

  const modelsData = modelsQuery.data || [];

  console.log("SPECIALIZATION", modelsData);

  const ui = modelsData.map((model) => {
    // Find the model for this UID
    // const model = modelsData.find(m => m.uid === uid);

    return (
      <Typography
        key={model.uid}
        variant="body1"
        sx={{ 
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1
        }}
        onClick={handleUIDClick.bind(this, model.uid)}
      >
        <span>{model.uid}</span>
        {model && <span> - {model.name}</span>}
      </Typography>
    );
  });

  return (
    <Stack direction="column" spacing={1}>
      {ui}
    </Stack>
  );
};

export default Classification;
