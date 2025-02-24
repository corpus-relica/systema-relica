import React from "react";
import { observer } from "mobx-react-lite";
import { toJS } from "mobx";
import { useStores } from "../context/RootStoreContext.js";
// import Box from "@mui/material/Box";
// import Typography from "@mui/material/Typography";
// import List from "@mui/material/List";
// import ListItem from "@mui/material/ListItem";
// import ListItemText from "@mui/material/ListItemText";
// import Divider from "@mui/material/Divider";
import { Fact } from "@relica/types";
import { QueryResults } from "../types.js";

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";

const QueryResultsDisplay: React.FC = observer(() => {
  const rootStore = useStores();
  const queryResults: QueryResults = rootStore.queryResult || {
    groundingFacts: [],
    facts: [],
    vars: [],
    totalCount: 0,
  };

  const getResolvedName = (uid: number): string => {
    const allFacts = [...queryResults.groundingFacts, ...queryResults.facts];
    const fact = toJS(allFacts).find(
      (f) =>
        (f.rel_type_uid === 1146 ||
          f.rel_type_uid === 1726 ||
          f.rel_type_uid === 1225) &&
        f.lh_object_uid === uid
    );
    return fact
      ? fact.lh_object_uid === uid
        ? fact.lh_object_name
        : fact.rh_object_name
      : `Unknown (${uid})`;
  };

  const findGroundingFact = (uid: number): Fact => {
    const allFacts = [...queryResults.groundingFacts, ...queryResults.facts];
    const fact = toJS(allFacts).find(
      (f) =>
        (f.rel_type_uid === 1146 ||
          f.rel_type_uid === 1726 ||
          f.rel_type_uid === 1225) &&
        f.lh_object_uid === uid
    );
    return fact;
  };

  return (
    <Box sx={{ height: "100%", overflow: "auto", position: "relative" }}>
      {queryResults.vars.map((variable) => (
        <Box key={variable.uid} sx={{ mb: 1 }}>
          <Typography
            variant="subtitle2"
            sx={{
              position: "sticky",
              top: 0,
              bgcolor: "background.paper",
              zIndex: 1,
              py: 0.5,
              fontWeight: "bold",
            }}
          >
            {variable.name} (UID: {variable.uid})
          </Typography>
          <List dense disablePadding>
            {variable.possibleValues.map((value, index) => {
              const groundingFact = findGroundingFact(value);
              const name = groundingFact.lh_object_name;
              return (
                <React.Fragment key={value}>
                  {index > 0 && <Divider />}
                  <ListItem sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={name}
                      secondary={
                        <React.Fragment>
                          <Typography variant="caption" color="textSecondary">
                            UID: {value}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textSecondary"
                            component={"div"}
                          >
                            <Typography variant="caption" color="textSecondary">
                              {groundingFact.rel_type_name}
                            </Typography>{" "}
                            <Typography variant="caption" color="textSecondary">
                              {groundingFact.rh_object_name}
                            </Typography>
                          </Typography>
                        </React.Fragment>
                      }
                      primaryTypographyProps={{ variant: "body2" }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </Box>
      ))}
    </Box>
  );
});

export default QueryResultsDisplay;
