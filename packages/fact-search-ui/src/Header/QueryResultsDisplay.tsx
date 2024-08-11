import React from "react";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import { useStores } from "../context/RootStoreContext";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";

interface Var {
  uid: number;
  name: string;
  possibleValues: number[];
  isResolved: boolean;
}

interface QueryResults {
  facts: any[]; // You might want to define a more specific type for facts
  vars: Var[];
}

const QueryResultsDisplay: React.FC = observer(() => {
  const rootStore = useStores();
  const queryResults: QueryResults = rootStore.queryResult || {
    facts: [],
    vars: [],
  };

  const getResolvedName = (uid: number): string => {
    const fact = toJS(queryResults.facts).find(
      (f) =>
        (f.rel_type_uid === 1146 || f.rel_type_uid === 1225) &&
        f.lh_object_uid === uid
    );
    return fact
      ? fact.lh_object_uid === uid
        ? fact.lh_object_name
        : fact.rh_object_name
      : `Unknown (${uid})`;
  };

  return (
    <Box sx={{ height: "100%", overflow: "auto", position: "relative" }}>
      <Typography
        variant="h6"
        sx={{
          position: "sticky",
          top: 0,
          bgcolor: "background.paper",
          zIndex: 2,
          py: 1,
        }}
      >
        Query Results
      </Typography>
      {queryResults.vars.map((variable) => (
        <Box key={variable.uid} sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              position: "sticky",
              top: "40px", // Adjust based on the height of the "Query Results" header
              bgcolor: "background.paper",
              zIndex: 1,
              py: 1,
            }}
          >
            {variable.name} (UID: {variable.uid})
          </Typography>
          <List dense>
            {variable.possibleValues.map((value, index) => (
              <React.Fragment key={value}>
                {index > 0 && <Divider />}
                <ListItem>
                  <ListItemText
                    primary={getResolvedName(value)}
                    secondary={`UID: ${value}`}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Box>
      ))}
    </Box>
  );
});

export default QueryResultsDisplay;
