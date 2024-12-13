import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";

import { useStores } from "../context/RootStoreContext";
import { observer } from "mobx-react";

const GraphLegend: React.FC = observer(() => {
  const { colorPaletteStore, factDataStore } = useStores();
  const { getRelTypeName } = factDataStore;
  const { paletteMap } = colorPaletteStore;

  const entries = Array.from(paletteMap.entries()).map(([key, value]) => {
    const name = getRelTypeName(key);
    const backgroundColor = "white";
    // graphViewStore.hoveredLinkType === key ? "light-4" : "white";
    return (
      <Stack
        direction="row"
        gap="xsmall"
        pad="xxsmall"
        key={key}
        background={backgroundColor}
      >
        <Box
          sx={{
            width: "20px",
            height: "10px",
            backgroundColor: value,
            marginTop: "5px",
            marginRight: "5px",
          }}
        />
        <Typography fontSize={"0.75em"}>
          {key}
          {" : "}
          {name}
        </Typography>
      </Stack>
    );
  });

  return (
    <Paper
      elevation={0}
      borderRadius={1}
      sx={{
        position: "absolute",
        bottom: 20,
        left: 20,
        padding: 1,
        backgroundColor: "#121212",
      }}
    >
      <Box
        pad={"xsmall"}
        margin={"xsmall"}
        style={{ backgroundColor: "rgba(0, 12, 26)" }}
      >
        <Typography>GraphLegend</Typography>
        {entries}
      </Box>
    </Paper>
  );
});

export default GraphLegend;
