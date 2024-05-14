import React, { useEffect } from "react";
import { Box, Grid, Grommet, Stack, Text, Tabs, Tab } from "grommet";
import useRootStoreContext from "../hooks/useRootStoreContext";
import { observer } from "mobx-react";

const GraphLegend: React.FC = observer(() => {
  const { colorPaletteStore, factDataStore, graphViewStore } =
    useRootStoreContext();
  const { getRelTypeName } = factDataStore;
  const { paletteMap } = colorPaletteStore;

  const entries = Array.from(paletteMap.entries()).map(([key, value]) => {
    const name = getRelTypeName(key);
    const backgroundColor =
      graphViewStore.hoveredLinkType === key ? "light-4" : "white";
    return (
      <Box
        direction="row"
        gap="xsmall"
        pad="xxsmall"
        key={key}
        background={backgroundColor}
      >
        <Box background={value} width="20px" height="20px" />
        <Text size="xsmall">
          {key}
          {" : "}
          {name}
        </Text>
      </Box>
    );
  });

  return (
    <Box pad={"xsmall"} margin={"xsmall"} style={{ backgroundColor: "white" }}>
      <Text>GraphLegend</Text>
      {entries}
    </Box>
  );
});

export default GraphLegend;
