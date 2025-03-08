import React, { useContext } from "react";
import { toJS } from "mobx";
import { sockSendCC } from "../../../socket";
import { useStore } from "react-admin";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import { useQuery } from "@tanstack/react-query";
import { portalClient } from "../../../io/PortalClient.js";

interface SpecializationProps {
  uids: number[]; // specify the correct type instead of any if possible
  childUID: number;
}

const Specialization: React.FC<SpecializationProps> = ({ uids, childUID }) => {
  console.log("SPECIALIZATION", uids, childUID);

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
    sockSendCC("user", "loadEntity", { uid: childUID });
  };

  if (modelsQuery.isLoading) return <Typography>Loading...</Typography>;
  if (modelsQuery.error) return <Typography color="error">Error loading models</Typography>;

  const modelsData = modelsQuery.data || [];

  const ui = uids.map((uid, index) => {
    // Find the model for this UID
    const model = modelsData.find(m => m.uid === uid);
    
    return (
      <Typography
        key={uid}
        variant="h6"
        sx={{ 
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1
        }}
        onClick={handleUIDClick.bind(this, uid)}
      >
        <span>{uid}</span>
        {model && <span> - {model.name}</span>}
      </Typography>
    );
  });

  return (
    <Stack direction="column" style={{ color: "red" }}>
      {ui}
    </Stack>
  );
};

export default Specialization;
