import React, { useEffect } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
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
    <Box pad={"xsmall"} margin={"xsmall"} style={{ backgroundColor: "grey" }}>
      <Typography>GraphLegend</Typography>
      {entries}
    </Box>
  );
});

export default GraphLegend;
