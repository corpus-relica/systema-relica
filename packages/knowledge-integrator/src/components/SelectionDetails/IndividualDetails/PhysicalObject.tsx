import React from "react";
import { useQuery } from "@tanstack/react-query";
import { sendSocketMessage } from "../../../socket";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";
import {retrieveIndividualModel} from "../../../CCClient.js";


// Helper component to display arrays of UIDs with resolved names
const EntityList = ({ 
  label, 
  uids, 
  emptyMessage = "None"
}) => {
  // Query for all UIDs in the array
  const modelsQuery = useQuery({
    queryKey: ["entityModels", uids],
    queryFn: () =>
      uids && uids.length > 0
        ? Promise.all(
            uids.map((uid) =>
              // ;; TODO ultimately use generic 'retrieveEntityModel' call
              retrieveIndividualModel(uid).then((res) => ({
                uid,
                ...res
              }))
            )
          )
        : Promise.resolve([]),
    enabled: !!uids && uids.length > 0
  });

  const handleEntityClick = (uid) => {
    sendSocketMessage("user:loadEntity", { uid });
  };

  if (modelsQuery.isLoading) return <Typography variant="body2">Loading {label}...</Typography>;
  if (modelsQuery.error) return <Typography color="error" variant="body2">Error loading {label}</Typography>;

  const entities = modelsQuery.data || [];

  if(entities.length === 0) return (
    null
  );

  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
        {label}:
      </Typography>
      
      {entities.length > 0 ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {entities.map((entity) => (
            <Chip
              key={entity.uid}
              label={`${entity.uid} - ${entity.name || 'Unknown'}`}
              onClick={() => handleEntityClick(entity.uid)}
              clickable
              color="primary"
              variant="outlined"
              size="small"
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>
      )}
    </Box>
  );
};

const IndividualPhysicalObjectDetails = (data) => {
  const {
    uid,
    name,
    category,
    classifiers = [],
    aspects = [],
    parts = [],
    totalities = [],
    involvements = [],
    "connected-to": connectedTo = [],
    "connections-in": connectionsIn = []
  } = data;

  console.log("!!!!!!!!!!!!!!!!!!!!!!! IndividualPhysicalObjectDetails", data);

  return (
    <Stack spacing={2} sx={{ p: 1 }}>
      <Box>
        <Typography variant="h6" component="h2">
          {name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          UID: {uid} | Category: {category}
        </Typography>
      </Box>

      <Divider />

      {/* Aspects */}
      <EntityList 
        label="Aspects" 
        uids={aspects} 
        emptyMessage="No aspects defined" 
      />

      {/* Parts */}
      <EntityList 
        label="Parts" 
        uids={parts} 
        emptyMessage="No parts defined" 
      />

      {/* Totalities */}
      <EntityList 
        label="Part of" 
        uids={totalities} 
        emptyMessage="Not part of any whole" 
      />

      {/* Involvements */}
      <EntityList 
        label="Involved in" 
        uids={involvements} 
        emptyMessage="Not involved in any occurrences" 
      />

      {/* Connected To */}
      <EntityList 
        label="Connected to" 
        uids={connectedTo} 
        emptyMessage="No outgoing connections" 
      />

      {/* Connections In */}
      <EntityList 
        label="Connections in" 
        uids={connectionsIn} 
        emptyMessage="No incoming connections" 
      />
    </Stack>
  );
};

export default IndividualPhysicalObjectDetails;
