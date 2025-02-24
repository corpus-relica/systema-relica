import React, { useState } from "react";
import { useStores } from "./context/RootStoreContext.js";
import { RootStore } from "./stores/RootStore.js";
import { observer } from "mobx-react-lite";
import { Fact } from "@relica/types";
import { toJS } from "mobx";
// import Box from "@mui/material/Box";
// import Grid from "@mui/material/Grid";
// import Button from "@mui/material/Button";
// import Typography from "@mui/material/Typography";

import { Box, Button, Grid, Typography } from "@mui/material";

const Body = observer((props: { callback: (fact: Fact) => void }) => {
  const { callback } = props;
  const rootStore: RootStore = useStores();
  const { facts } = rootStore;

  const [expandedUID, setExpandedUID] = useState<number | null>(null);

  const handleSelectClick = (row: Fact) => {
    callback && callback(toJS(row));
  };

  const toggleExpand = (uid: number) => {
    setExpandedUID(expandedUID === uid ? null : uid);
  };

  return (
    <Box sx={{ height: "100%", overflow: "auto", fontSize: "10px" }}>
      <Grid container direction="row" spacing={1}>
        <Grid item xs={0.25} />
        <Grid item xs={1}>
          fact_uid
        </Grid>
        <Grid item xs={1}>
          lh_object_uid
        </Grid>
        <Grid item xs={2.75}>
          lh_object_name
        </Grid>
        <Grid item xs={1}>
          rel_type_uid
        </Grid>
        <Grid item xs={2.25}>
          rel_type_name
        </Grid>
        <Grid item xs={1}>
          rh_object_uid
        </Grid>
        <Grid item xs={2.75}>
          rh_object_name
        </Grid>
      </Grid>
      {facts.map((fact: Fact, idx: number) => (
        <Grid key={fact.fact_uid} container direction="row" spacing={1}>
          <Grid item xs={0.25}>
            <Button onClick={() => toggleExpand(fact.fact_uid)}>
              {expandedUID === fact.fact_uid ? "▼" : "►"}
            </Button>
          </Grid>
          <Grid item xs={1}>
            {fact.fact_uid}
          </Grid>
          <Grid item xs={1}>
            {fact.lh_object_uid}
          </Grid>
          <Grid item xs={2.75}>
            {fact.lh_object_name}
          </Grid>
          <Grid item xs={1}>
            {fact.rel_type_uid}
          </Grid>
          <Grid item xs={2.25}>
            {fact.rel_type_name}
          </Grid>
          <Grid item xs={1}>
            {fact.rh_object_uid}
          </Grid>
          <Grid item xs={2.75}>
            {fact.rh_object_name}
          </Grid>
          {expandedUID === fact.fact_uid && (
            <Grid item xs={12}>
              <Typography>{fact.full_definition}</Typography>
              <Button onClick={() => handleSelectClick(fact)}>Select</Button>
            </Grid>
          )}
        </Grid>
      ))}
    </Box>
  );
});

export default Body;
