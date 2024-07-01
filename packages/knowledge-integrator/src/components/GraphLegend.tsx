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
    console.log("VAAAAAAAAAALUE", value);
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
        <Box sx={{ width: "20px", height: "20px", backgroundColor: value }} />
        <Typography size="xsmall">
          {key}
          {" : "}
          {name}
        </Typography>
      </Stack>
    );
  });

  return (
    <Paper
      elevation={3}
      sx={{
        position: "absolute",
        bottom: 50,
        left: 20,
        padding: 2,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
      }}
    >
      <Box pad={"xsmall"} margin={"xsmall"} style={{ backgroundColor: "grey" }}>
        <Typography>GraphLegend</Typography>
        {entries}
      </Box>
    </Paper>
  );
});

export default GraphLegend;
